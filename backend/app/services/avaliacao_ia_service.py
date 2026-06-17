from __future__ import annotations

import asyncio
import json
import os
import uuid
from collections.abc import AsyncIterator

from pydantic import ValidationError
from sqlalchemy import select

from app.api.deps import CurrentUser
from app.core.config import get_settings
from app.models.avaliacoes import AvaliacaoChatMensagem
from app.models.conteudo import MaterialEstudo, PastaConteudo
from app.models.enums import PapelChat, StatusAvaliacao, TipoQuestao
from app.schemas.avaliacoes import ChatMensagemResponse, IaGerarRequest, QuestaoUpsert
from app.services.avaliacoes_service import AvaliacoesService

# Sentinelas usadas pelo modelo para delimitar cada questão pronta no stream.
SENTINELA_INI = "<<<QUESTAO>>>"
SENTINELA_FIM = "<<<FIM>>>"

# Limite de caracteres do contexto de conteúdo injetado no prompt.
MAX_CONTEXTO_CHARS = 24000

INSTRUCOES_SISTEMA = f"""\
Você é um assistente especialista em elaboração de provas escolares, integrado a uma \
plataforma educacional. Converse em português do Brasil com o professor e, conforme o \
pedido dele, MONTE as questões da prova.

REGRAS DE FORMATO (obrigatórias):
- Para CADA questão pronta, emita UMA linha isolada exatamente assim:
  {SENTINELA_INI}{{json}}{SENTINELA_FIM}
  onde {{json}} é um objeto JSON em uma única linha (sem quebras) com os campos:
    - "tipo": "multipla_escolha" ou "texto_aberto"
    - "enunciado": string com o enunciado da questão
    - "alternativas": lista de strings (APENAS para multipla_escolha; mínimo 2). Para \
texto_aberto, omita ou use null.
    - "resposta_correta": índice inteiro (base 0) da alternativa correta (APENAS para \
multipla_escolha). Para texto_aberto, omita ou use null.
    - "peso": número (use 1 se não houver instrução específica)
- O índice "resposta_correta" deve ser válido (0 <= índice < número de alternativas).
- Multipla_escolha SEMPRE precisa de pelo menos 2 alternativas e de uma resposta_correta válida.
- Texto fora das sentinelas é tratado como mensagem de chat para o professor (use para \
explicar o que está fazendo). NUNCA coloque o JSON da questão fora das sentinelas.
- Não use ferramentas externas nem acesse arquivos; baseie-se apenas no contexto fornecido.
- Siga rigorosamente o formato/estilo que o professor pedir (quantidade, dificuldade, tema).
"""


def _sse(tipo: str, **dados) -> str:
    payload = {"type": tipo, **dados}
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


class AvaliacaoIaService:
    def __init__(self, db) -> None:
        self.db = db
        self.settings = get_settings()
        self._aval = AvaliacoesService(db)

    # ------------------------------------------------------------------ #
    # Histórico
    # ------------------------------------------------------------------ #
    def historico(
        self, user: CurrentUser, avaliacao_id: uuid.UUID
    ) -> list[ChatMensagemResponse]:
        inst_id = self._aval._inst_id(user)
        self._aval._avaliacao_tenant(avaliacao_id, inst_id)
        rows = self.db.scalars(
            select(AvaliacaoChatMensagem)
            .where(AvaliacaoChatMensagem.avaliacao_id == avaliacao_id)
            .order_by(AvaliacaoChatMensagem.criado_em)
        ).all()
        return [
            ChatMensagemResponse(
                id=m.id,
                papel=m.papel.value if hasattr(m.papel, "value") else str(m.papel),
                conteudo=m.conteudo,
                criado_em=m.criado_em,
            )
            for m in rows
        ]

    # ------------------------------------------------------------------ #
    # Geração com streaming (SSE)
    # ------------------------------------------------------------------ #
    async def gerar_stream(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: IaGerarRequest
    ) -> AsyncIterator[str]:
        inst_id = self._aval._inst_id(user)
        av = self._aval._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status != StatusAvaliacao.rascunho:
            yield _sse("erro", mensagem="A avaliação não está em rascunho.")
            return

        # Autenticação do CLI: token OAuth da assinatura (claude setup-token) OU
        # uma ANTHROPIC_API_KEY. Basta um dos dois.
        if not (os.environ.get("CLAUDE_CODE_OAUTH_TOKEN") or self.settings.anthropic_api_key):
            yield _sse(
                "erro",
                mensagem=(
                    "IA não configurada: rode 'claude setup-token' e defina "
                    "CLAUDE_CODE_OAUTH_TOKEN no backend (ou use ANTHROPIC_API_KEY)."
                ),
            )
            return

        professor_id = self._aval._professor_id(user)

        # Persiste a mensagem do professor.
        self.db.add(
            AvaliacaoChatMensagem(
                avaliacao_id=avaliacao_id,
                professor_id=professor_id,
                papel=PapelChat.usuario,
                conteudo=body.mensagem,
            )
        )
        self.db.commit()

        contexto = self._montar_contexto(inst_id, body)
        historico_txt = self._historico_texto(avaliacao_id)
        prompt = self._montar_prompt(body.mensagem, contexto, historico_txt)

        yield _sse("inicio")

        ordem = len(av.questoes)
        chat_acumulado: list[str] = []
        try:
            async for evento in self._rodar_cli(prompt):
                tipo = evento[0]
                if tipo == "texto":
                    chat_acumulado.append(evento[1])
                    yield _sse("mensagem", delta=evento[1])
                elif tipo == "questao_json":
                    questao = self._validar_questao(evento[1], ordem + 1)
                    if questao is not None:
                        ordem += 1
                        yield _sse("questao", questao=questao)
                    else:
                        yield _sse(
                            "aviso",
                            mensagem="Uma questão gerada foi ignorada por formato inválido.",
                        )
                elif tipo == "erro":
                    yield _sse("erro", mensagem=evento[1])
        except Exception as exc:  # noqa: BLE001 - superfície de erro p/ o cliente
            yield _sse("erro", mensagem=f"Falha ao executar a IA: {exc}")

        # Persiste a resposta do assistente (texto de chat, sem os blocos de questão).
        texto_final = "".join(chat_acumulado).strip()
        if texto_final:
            self.db.add(
                AvaliacaoChatMensagem(
                    avaliacao_id=avaliacao_id,
                    professor_id=professor_id,
                    papel=PapelChat.assistente,
                    conteudo=texto_final,
                )
            )
            self.db.commit()

        yield _sse("fim")

    # ------------------------------------------------------------------ #
    # Contexto (@ referências) e prompt
    # ------------------------------------------------------------------ #
    def _montar_contexto(self, inst_id: uuid.UUID, body: IaGerarRequest) -> str:
        partes: list[str] = []

        # Pastas inteiras: junta o texto de todos os materiais.
        for pasta_id in body.pasta_ids:
            pasta = self.db.get(PastaConteudo, pasta_id)
            if not pasta or pasta.instituicao_id != inst_id:
                continue
            materiais = self.db.scalars(
                select(MaterialEstudo).where(
                    MaterialEstudo.pasta_conteudo_id == pasta_id
                )
            ).all()
            partes.append(f"## Pasta de conteúdo: {pasta.nome_disciplina}")
            for m in materiais:
                partes.append(self._material_texto(m))

        # Materiais individuais.
        for material_id in body.material_ids:
            m = self.db.get(MaterialEstudo, material_id)
            if not m:
                continue
            pasta = self.db.get(PastaConteudo, m.pasta_conteudo_id)
            if not pasta or pasta.instituicao_id != inst_id:
                continue
            partes.append(self._material_texto(m))

        texto = "\n\n".join(p for p in partes if p.strip())
        if len(texto) > MAX_CONTEXTO_CHARS:
            texto = texto[:MAX_CONTEXTO_CHARS] + "\n...[conteúdo truncado]"
        return texto

    @staticmethod
    def _material_texto(m: MaterialEstudo) -> str:
        cabecalho = f"### Material: {m.titulo}"
        if m.descricao:
            cabecalho += f"\n_{m.descricao}_"
        if m.corpo_texto:
            return f"{cabecalho}\n{m.corpo_texto}"
        # Sem texto extraído (PDF/áudio/vídeo): só metadados.
        return f"{cabecalho}\n(Tipo: {m.tipo_anexo.value}; sem texto extraído disponível.)"

    def _historico_texto(self, avaliacao_id: uuid.UUID) -> str:
        rows = self.db.scalars(
            select(AvaliacaoChatMensagem)
            .where(AvaliacaoChatMensagem.avaliacao_id == avaliacao_id)
            .order_by(AvaliacaoChatMensagem.criado_em)
        ).all()
        # Ignora a última (mensagem atual do usuário, já incluída adiante).
        linhas: list[str] = []
        for m in rows[:-1]:
            papel = "Professor" if m.papel == PapelChat.usuario else "Assistente"
            linhas.append(f"{papel}: {m.conteudo}")
        return "\n".join(linhas)

    def _montar_prompt(self, mensagem: str, contexto: str, historico: str) -> str:
        blocos = [INSTRUCOES_SISTEMA]
        if historico:
            blocos.append(f"# Histórico da conversa\n{historico}")
        if contexto:
            blocos.append(f"# Conteúdo de referência anexado\n{contexto}")
        blocos.append(f"# Pedido atual do professor\n{mensagem}")
        return "\n\n".join(blocos)

    # ------------------------------------------------------------------ #
    # Execução do Claude Code CLI
    # ------------------------------------------------------------------ #
    async def _rodar_cli(self, prompt: str) -> AsyncIterator[tuple[str, str]]:
        args = [
            self.settings.claude_cli_path,
            "-p",
            "--output-format",
            "stream-json",
            "--verbose",
            "--include-partial-messages",
            "--max-turns",
            "1",
        ]
        if self.settings.claude_model:
            args += ["--model", self.settings.claude_model]

        env = dict(os.environ)
        # Mantém CLAUDE_CODE_OAUTH_TOKEN herdado do container (autenticação por
        # assinatura). Só define ANTHROPIC_API_KEY se houver uma de fato — uma
        # chave vazia atrapalharia o login por token.
        if not env.get("ANTHROPIC_API_KEY"):
            env.pop("ANTHROPIC_API_KEY", None)
        if self.settings.anthropic_api_key:
            env["ANTHROPIC_API_KEY"] = self.settings.anthropic_api_key
        env.setdefault("HOME", "/tmp/claude-home")

        try:
            proc = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )
        except FileNotFoundError:
            yield ("erro", "CLI 'claude' não encontrado no backend.")
            return

        assert proc.stdin and proc.stdout
        proc.stdin.write(prompt.encode("utf-8"))
        await proc.stdin.drain()
        proc.stdin.close()

        scanner = _ScannerSentinela()
        usou_parcial = False
        async for raw in proc.stdout:
            linha = raw.decode("utf-8", errors="replace").strip()
            if not linha:
                continue
            try:
                obj = json.loads(linha)
            except json.JSONDecodeError:
                continue
            texto = self._extrair_texto(obj)
            if texto is None:
                continue
            tipo_evt = obj.get("type")
            if tipo_evt == "stream_event":
                usou_parcial = True
            elif usou_parcial and tipo_evt == "assistant":
                # Evita duplicar texto já recebido via deltas parciais.
                continue
            for ev in scanner.feed(texto):
                yield ev

        for ev in scanner.flush():
            yield ev

        await proc.wait()
        if proc.returncode not in (0, None):
            stderr = (await proc.stderr.read()).decode("utf-8", errors="replace") if proc.stderr else ""
            if stderr.strip():
                yield ("erro", stderr.strip()[:500])

    @staticmethod
    def _extrair_texto(obj: dict) -> str | None:
        tipo = obj.get("type")
        if tipo == "stream_event":
            ev = obj.get("event", {})
            if ev.get("type") == "content_block_delta":
                delta = ev.get("delta", {})
                if delta.get("type") == "text_delta":
                    return delta.get("text", "")
            return None
        if tipo == "assistant":
            msg = obj.get("message", {})
            partes = [
                b.get("text", "")
                for b in msg.get("content", [])
                if isinstance(b, dict) and b.get("type") == "text"
            ]
            return "".join(partes) if partes else None
        return None

    # ------------------------------------------------------------------ #
    # Validação de questão gerada
    # ------------------------------------------------------------------ #
    @staticmethod
    def _validar_questao(json_str: str, ordem: int) -> dict | None:
        try:
            dados = json.loads(json_str)
        except json.JSONDecodeError:
            return None
        tipo = dados.get("tipo")
        if tipo not in (TipoQuestao.multipla_escolha.value, TipoQuestao.texto_aberto.value):
            return None
        alternativas = dados.get("alternativas")
        resposta = dados.get("resposta_correta")
        if tipo == TipoQuestao.multipla_escolha.value:
            if not isinstance(alternativas, list) or len(alternativas) < 2:
                return None
            if not isinstance(resposta, int) or not (0 <= resposta < len(alternativas)):
                return None
        else:
            alternativas = None
            resposta = None
        enunciado = (dados.get("enunciado") or "").strip()
        if not enunciado:
            return None
        try:
            peso = float(dados.get("peso", 1) or 1)
        except (TypeError, ValueError):
            peso = 1.0

        # Confirma compatibilidade com o contrato do sistema.
        try:
            QuestaoUpsert(
                tipo=tipo,
                ordem=ordem,
                enunciado=enunciado,
                alternativas=alternativas,
                resposta_correta=resposta,
                peso=peso,
            )
        except ValidationError:
            return None

        return {
            "tipo": tipo,
            "ordem": ordem,
            "enunciado": enunciado,
            "alternativas": alternativas,
            "resposta_correta": resposta,
            "peso": peso,
        }


class _ScannerSentinela:
    """Separa texto de chat dos blocos de questão delimitados por sentinelas,
    de forma incremental (lida com tokens divididos entre chunks)."""

    def __init__(self) -> None:
        self.buffer = ""

    def feed(self, texto: str) -> list[tuple[str, str]]:
        self.buffer += texto
        eventos: list[tuple[str, str]] = []
        while True:
            ini = self.buffer.find(SENTINELA_INI)
            if ini == -1:
                # Sem início de questão: emite texto seguro, retendo possível
                # prefixo parcial da sentinela no final.
                seguro, retido = _corta_prefixo_parcial(self.buffer, SENTINELA_INI)
                if seguro:
                    eventos.append(("texto", seguro))
                self.buffer = retido
                break
            # Texto antes da questão é chat.
            if ini > 0:
                eventos.append(("texto", self.buffer[:ini]))
            resto = self.buffer[ini + len(SENTINELA_INI):]
            fim = resto.find(SENTINELA_FIM)
            if fim == -1:
                # Questão ainda incompleta; aguarda mais dados.
                self.buffer = self.buffer[ini:]
                break
            json_str = resto[:fim]
            eventos.append(("questao_json", json_str))
            self.buffer = resto[fim + len(SENTINELA_FIM):]
        return eventos

    def flush(self) -> list[tuple[str, str]]:
        eventos: list[tuple[str, str]] = []
        texto = self.buffer.strip()
        # Só emite o resto como chat se não for uma sentinela inacabada.
        if texto and SENTINELA_INI not in self.buffer:
            eventos.append(("texto", self.buffer))
        self.buffer = ""
        return eventos


def _corta_prefixo_parcial(texto: str, token: str) -> tuple[str, str]:
    """Retorna (parte_segura, parte_retida) onde parte_retida é um possível
    prefixo do token no final do texto (para não emitir sentinela pela metade)."""
    maximo = min(len(token) - 1, len(texto))
    for k in range(maximo, 0, -1):
        if texto.endswith(token[:k]):
            return texto[:-k], texto[-k:]
    return texto, ""
