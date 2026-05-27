from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import CurrentUser
from app.core.exceptions import bad_request, conflict, forbidden, not_found
from app.models.avaliacoes import (
    Assunto,
    Avaliacao,
    MateriaCurricular,
    PastaAvaliacoes,
    Questao,
    RespostaQuestao,
    Submissao,
)
from app.models.enums import (
    SituacaoMatricula,
    StatusAvaliacao,
    StatusSubmissao,
    TipoPerfil,
    TipoQuestao,
)
from app.models.governanca import Matricula, Professor, UsuarioConta
from app.schemas.avaliacoes import (
    AlunoAvaliacaoDisponivel,
    AlunoAvaliacaoView,
    ArvoreAssunto,
    ArvoreMateria,
    ArvorePasta,
    AssuntoCreate,
    AssuntoPatch,
    AssuntoResponse,
    AvaliacaoCreate,
    AvaliacaoDetail,
    AvaliacaoListItem,
    AvaliacaoPatch,
    MateriaCreate,
    MateriaPatch,
    MateriaResponse,
    PastaCreate,
    PastaPatch,
    PastaResponse,
    QuestaoAlunoView,
    QuestaoResponse,
    QuestaoUpsert,
    QuestoesBulkReplace,
    SubmissaoPatch,
    SubmissaoResponse,
)


class AvaliacoesService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _inst_id(self, user: CurrentUser) -> uuid.UUID:
        if not user.instituicao_id:
            raise forbidden()
        return user.instituicao_id

    def _professor_id(self, user: CurrentUser) -> uuid.UUID:
        if user.professor_id:
            return user.professor_id
        if user.perfil == TipoPerfil.administrador and user.instituicao_id:
            prof = self.db.scalar(
                select(Professor)
                .join(UsuarioConta, Professor.usuario_id == UsuarioConta.id)
                .where(UsuarioConta.instituicao_id == user.instituicao_id)
                .limit(1)
            )
            if prof:
                return prof.id
        raise forbidden("Professor não vinculado")

    def _materia_tenant(self, materia_id: uuid.UUID, inst_id: uuid.UUID) -> MateriaCurricular:
        m = self.db.get(MateriaCurricular, materia_id)
        if not m or m.instituicao_id != inst_id:
            raise not_found()
        return m

    def _avaliacao_tenant(self, avaliacao_id: uuid.UUID, inst_id: uuid.UUID) -> Avaliacao:
        av = self.db.scalar(
            select(Avaliacao)
            .join(PastaAvaliacoes, Avaliacao.pasta_id == PastaAvaliacoes.id)
            .join(Assunto, PastaAvaliacoes.assunto_id == Assunto.id)
            .join(MateriaCurricular, Assunto.materia_id == MateriaCurricular.id)
            .where(
                Avaliacao.id == avaliacao_id,
                MateriaCurricular.instituicao_id == inst_id,
            )
            .options(selectinload(Avaliacao.questoes))
        )
        if not av:
            raise not_found()
        return av

    def list_materias(self, user: CurrentUser) -> list[MateriaResponse]:
        inst_id = self._inst_id(user)
        rows = self.db.scalars(
            select(MateriaCurricular)
            .where(MateriaCurricular.instituicao_id == inst_id)
            .order_by(MateriaCurricular.ordem.nulls_last(), MateriaCurricular.nome)
        ).all()
        return [
            MateriaResponse(id=m.id, nome=m.nome, slug=m.slug, cor_token_ui=m.cor_token_ui, ordem=m.ordem)
            for m in rows
        ]

    def create_materia(self, user: CurrentUser, body: MateriaCreate) -> MateriaResponse:
        inst_id = self._inst_id(user)
        prof_id = self._professor_id(user)
        m = MateriaCurricular(
            instituicao_id=inst_id,
            professor_autor_id=prof_id,
            nome=body.nome,
            slug=body.slug,
            cor_token_ui=body.cor_token_ui,
            ordem=body.ordem,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return MateriaResponse(id=m.id, nome=m.nome, slug=m.slug, cor_token_ui=m.cor_token_ui, ordem=m.ordem)

    def patch_materia(self, user: CurrentUser, materia_id: uuid.UUID, body: MateriaPatch) -> MateriaResponse:
        inst_id = self._inst_id(user)
        m = self._materia_tenant(materia_id, inst_id)
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(m, k, v)
        self.db.commit()
        self.db.refresh(m)
        return MateriaResponse(id=m.id, nome=m.nome, slug=m.slug, cor_token_ui=m.cor_token_ui, ordem=m.ordem)

    def delete_materia(self, user: CurrentUser, materia_id: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        m = self._materia_tenant(materia_id, inst_id)
        self.db.delete(m)
        self.db.commit()

    def get_arvore(self, user: CurrentUser, materia_id: uuid.UUID) -> ArvoreMateria:
        inst_id = self._inst_id(user)
        m = self._materia_tenant(materia_id, inst_id)
        assuntos = self.db.scalars(
            select(Assunto).where(Assunto.materia_id == m.id).order_by(Assunto.ordem)
        ).all()
        arvore_assuntos = []
        for a in assuntos:
            pastas = self.db.scalars(
                select(PastaAvaliacoes).where(PastaAvaliacoes.assunto_id == a.id)
            ).all()
            arvore_pastas = []
            for p in pastas:
                avs = self.db.scalars(
                    select(Avaliacao).where(Avaliacao.pasta_id == p.id)
                ).all()
                arvore_pastas.append(
                    ArvorePasta(
                        id=p.id,
                        nome=p.nome,
                        avaliacoes=[
                            AvaliacaoListItem(
                                id=av.id,
                                titulo=av.titulo,
                                status=av.status,
                                prazo_utc=av.prazo_utc,
                                publicado_em=av.publicado_em,
                            )
                            for av in avs
                        ],
                    )
                )
            arvore_assuntos.append(
                ArvoreAssunto(id=a.id, nome=a.nome, ordem=a.ordem, pastas=arvore_pastas)
            )
        return ArvoreMateria(id=m.id, nome=m.nome, assuntos=arvore_assuntos)

    def create_assunto(self, user: CurrentUser, materia_id: uuid.UUID, body: AssuntoCreate) -> AssuntoResponse:
        inst_id = self._inst_id(user)
        self._materia_tenant(materia_id, inst_id)
        a = Assunto(materia_id=materia_id, nome=body.nome, ordem=body.ordem)
        self.db.add(a)
        self.db.commit()
        self.db.refresh(a)
        return AssuntoResponse(id=a.id, nome=a.nome, ordem=a.ordem)

    def patch_assunto(self, user: CurrentUser, assunto_id: uuid.UUID, body: AssuntoPatch) -> AssuntoResponse:
        inst_id = self._inst_id(user)
        a = self.db.get(Assunto, assunto_id)
        if not a:
            raise not_found()
        self._materia_tenant(a.materia_id, inst_id)
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(a, k, v)
        self.db.commit()
        self.db.refresh(a)
        return AssuntoResponse(id=a.id, nome=a.nome, ordem=a.ordem)

    def delete_assunto(self, user: CurrentUser, assunto_id: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        a = self.db.get(Assunto, assunto_id)
        if not a:
            raise not_found()
        self._materia_tenant(a.materia_id, inst_id)
        self.db.delete(a)
        self.db.commit()

    def create_pasta(self, user: CurrentUser, assunto_id: uuid.UUID, body: PastaCreate) -> PastaResponse:
        inst_id = self._inst_id(user)
        a = self.db.get(Assunto, assunto_id)
        if not a:
            raise not_found()
        self._materia_tenant(a.materia_id, inst_id)
        p = PastaAvaliacoes(assunto_id=assunto_id, nome=body.nome)
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)
        return self._pasta_response(p)

    def get_pasta(self, user: CurrentUser, pasta_id: uuid.UUID) -> PastaResponse:
        inst_id = self._inst_id(user)
        p = self.db.get(PastaAvaliacoes, pasta_id)
        if not p:
            raise not_found()
        self._materia_tenant(p.assunto.materia_id, inst_id)
        return self._pasta_response(p)

    def patch_pasta(self, user: CurrentUser, pasta_id: uuid.UUID, body: PastaPatch) -> PastaResponse:
        inst_id = self._inst_id(user)
        p = self.db.get(PastaAvaliacoes, pasta_id)
        if not p:
            raise not_found()
        self._materia_tenant(p.assunto.materia_id, inst_id)
        if body.nome:
            p.nome = body.nome
        self.db.commit()
        self.db.refresh(p)
        return self._pasta_response(p)

    def _pasta_response(self, p: PastaAvaliacoes) -> PastaResponse:
        total_av = self.db.scalar(
            select(func.count()).select_from(Avaliacao).where(Avaliacao.pasta_id == p.id)
        )
        total_sub = self.db.scalar(
            select(func.count())
            .select_from(Submissao)
            .join(Avaliacao, Submissao.avaliacao_id == Avaliacao.id)
            .where(Avaliacao.pasta_id == p.id)
        )
        return PastaResponse(
            id=p.id,
            nome=p.nome,
            resumo_status_texto=p.resumo_status_texto,
            total_avaliacoes=total_av or 0,
            total_submissoes=total_sub or 0,
        )

    def list_avaliacoes_pasta(self, user: CurrentUser, pasta_id: uuid.UUID) -> list[AvaliacaoListItem]:
        self.get_pasta(user, pasta_id)
        rows = self.db.scalars(select(Avaliacao).where(Avaliacao.pasta_id == pasta_id)).all()
        return [
            AvaliacaoListItem(
                id=av.id,
                titulo=av.titulo,
                status=av.status,
                prazo_utc=av.prazo_utc,
                publicado_em=av.publicado_em,
            )
            for av in rows
        ]

    def create_avaliacao(
        self, user: CurrentUser, pasta_id: uuid.UUID, body: AvaliacaoCreate
    ) -> AvaliacaoDetail:
        self.get_pasta(user, pasta_id)
        av = Avaliacao(
            pasta_id=pasta_id,
            titulo=body.titulo,
            status=StatusAvaliacao.rascunho,
            prazo_utc=body.prazo_utc,
        )
        self.db.add(av)
        self.db.commit()
        self.db.refresh(av)
        return self._avaliacao_detail(av)

    def get_avaliacao(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        return self._avaliacao_detail(av)

    def patch_avaliacao(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: AvaliacaoPatch
    ) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status != StatusAvaliacao.rascunho:
            raise forbidden("Avaliação não está em rascunho")
        if body.titulo:
            av.titulo = body.titulo
        if body.prazo_utc is not None:
            av.prazo_utc = body.prazo_utc
        if body.payload_editor is not None:
            av.payload_editor_jsonb = body.payload_editor
        if body.instrucoes_gerais is not None:
            av.instrucoes_jsonb = body.instrucoes_gerais.model_dump(mode="json")
        self.db.commit()
        self.db.refresh(av)
        return self._avaliacao_detail(av)

    def salvar_rascunho(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AvaliacaoDetail:
        return self.get_avaliacao(user, avaliacao_id)

    def _validate_questoes_publicar(self, questoes: list[Questao]) -> None:
        if not questoes:
            raise bad_request("Publicar exige ao menos uma questão")
        for q in questoes:
            if q.tipo == TipoQuestao.multipla_escolha:
                alts = q.alternativas_jsonb or []
                if len(alts) < 2:
                    raise bad_request("MCQ exige ao menos 2 alternativas")
                if q.indice_gabarito is None or q.indice_gabarito < 0 or q.indice_gabarito >= len(alts):
                    raise bad_request("Gabarito MCQ inválido")

    def publicar(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status != StatusAvaliacao.rascunho:
            raise conflict("Avaliação não está em rascunho")
        self._validate_questoes_publicar(list(av.questoes))
        av.status = StatusAvaliacao.publicada
        av.publicado_em = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(av)
        return self._avaliacao_detail(av)

    def encerrar(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status != StatusAvaliacao.publicada:
            raise conflict("Apenas avaliações publicadas podem ser encerradas")
        av.status = StatusAvaliacao.encerrada
        av.encerrada_em = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(av)
        return self._avaliacao_detail(av)

    def _ensure_rascunho(self, av: Avaliacao) -> None:
        if av.status != StatusAvaliacao.rascunho:
            raise forbidden("Questões só podem ser editadas em rascunho")

    def _questao_from_upsert(self, avaliacao_id: uuid.UUID, q: QuestaoUpsert) -> Questao:
        from app.schemas.documento import documento_para_texto, texto_para_documento

        if q.conteudo:
            conteudo_dict = q.conteudo.model_dump(mode="json")
            enunciado = documento_para_texto(q.conteudo)
        else:
            enunciado = (q.enunciado or "").strip()
            conteudo_dict = texto_para_documento(enunciado).model_dump(mode="json")
        return Questao(
            id=q.id or uuid.uuid4(),
            avaliacao_id=avaliacao_id,
            ordem=q.ordem,
            tipo=q.tipo,
            enunciado=enunciado,
            conteudo_jsonb=conteudo_dict,
            alternativas_jsonb=q.alternativas,
            indice_gabarito=q.resposta_correta,
            peso=q.peso,
        )

    def replace_questoes(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: QuestoesBulkReplace
    ) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        self._ensure_rascunho(av)
        for old in list(av.questoes):
            self.db.delete(old)
        self.db.flush()
        for q in body.questoes:
            self.db.add(self._questao_from_upsert(avaliacao_id, q))
        self.db.commit()
        return self.get_avaliacao(user, avaliacao_id)

    def add_questao(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: QuestaoUpsert
    ) -> QuestaoResponse:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        self._ensure_rascunho(av)
        q = self._questao_from_upsert(avaliacao_id, body)
        self.db.add(q)
        self.db.commit()
        self.db.refresh(q)
        return self._questao_response(q)

    def patch_questao(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, qid: uuid.UUID, body: QuestaoUpsert
    ) -> QuestaoResponse:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        self._ensure_rascunho(av)
        q = self.db.get(Questao, qid)
        if not q or q.avaliacao_id != avaliacao_id:
            raise not_found()
        nova = self._questao_from_upsert(avaliacao_id, body)
        q.ordem = nova.ordem
        q.tipo = nova.tipo
        q.enunciado = nova.enunciado
        q.conteudo_jsonb = nova.conteudo_jsonb
        q.alternativas_jsonb = nova.alternativas_jsonb
        q.indice_gabarito = nova.indice_gabarito
        q.peso = nova.peso
        self.db.commit()
        self.db.refresh(q)
        return self._questao_response(q)

    def delete_questao(self, user: CurrentUser, avaliacao_id: uuid.UUID, qid: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        self._ensure_rascunho(av)
        q = self.db.get(Questao, qid)
        if not q or q.avaliacao_id != avaliacao_id:
            raise not_found()
        self.db.delete(q)
        self.db.commit()

    def reordenar_questoes(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, ordens: list[dict]
    ) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        self._ensure_rascunho(av)
        for item in ordens:
            qid = uuid.UUID(str(item["id"]))
            q = self.db.get(Questao, qid)
            if q and q.avaliacao_id == avaliacao_id:
                q.ordem = int(item["ordem"])
        self.db.commit()
        return self.get_avaliacao(user, avaliacao_id)

    def _avaliacao_detail(self, av: Avaliacao) -> AvaliacaoDetail:
        questoes = self.db.scalars(
            select(Questao).where(Questao.avaliacao_id == av.id).order_by(Questao.ordem)
        ).all()
        return AvaliacaoDetail(
            id=av.id,
            pasta_id=av.pasta_id,
            titulo=av.titulo,
            status=av.status,
            prazo_utc=av.prazo_utc,
            publicado_em=av.publicado_em,
            encerrada_em=av.encerrada_em,
            payload_editor=av.payload_editor_jsonb,
            instrucoes_gerais=av.instrucoes_jsonb,
            versao=av.versao,
            questoes=[self._questao_response(q) for q in questoes],
        )

    def _questao_response(self, q: Questao) -> QuestaoResponse:
        return QuestaoResponse(
            id=q.id,
            ordem=q.ordem,
            tipo=q.tipo,
            enunciado=q.enunciado,
            conteudo=q.conteudo_jsonb,
            alternativas=q.alternativas_jsonb,
            resposta_correta=q.indice_gabarito,
            peso=q.peso,
        )

    def aluno_disponiveis(self, user: CurrentUser) -> list[AlunoAvaliacaoDisponivel]:
        if not user.aluno_id:
            raise forbidden()
        now = datetime.now(UTC)
        avs = self.db.scalars(
            select(Avaliacao)
            .where(
                Avaliacao.status == StatusAvaliacao.publicada,
                (Avaliacao.prazo_utc.is_(None)) | (Avaliacao.prazo_utc > now),
            )
        ).all()
        result = []
        for av in avs:
            sub = self.db.scalar(
                select(Submissao).where(
                    Submissao.avaliacao_id == av.id,
                    Submissao.aluno_id == user.aluno_id,
                )
            )
            result.append(
                AlunoAvaliacaoDisponivel(
                    id=av.id,
                    titulo=av.titulo,
                    prazo_utc=av.prazo_utc,
                    status_submissao=sub.status if sub else None,
                )
            )
        return result

    def aluno_get_avaliacao(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AlunoAvaliacaoView:
        if not user.aluno_id:
            raise forbidden()
        av = self.db.get(Avaliacao, avaliacao_id)
        if not av or av.status not in (StatusAvaliacao.publicada, StatusAvaliacao.encerrada):
            raise not_found()
        if av.prazo_utc and av.prazo_utc < datetime.now(UTC) and av.status == StatusAvaliacao.publicada:
            raise forbidden("Prazo encerrado")
        questoes = self.db.scalars(
            select(Questao).where(Questao.avaliacao_id == av.id).order_by(Questao.ordem)
        ).all()
        sub = self.db.scalar(
            select(Submissao).where(
                Submissao.avaliacao_id == av.id,
                Submissao.aluno_id == user.aluno_id,
            )
        )
        return AlunoAvaliacaoView(
            id=av.id,
            titulo=av.titulo,
            prazo_utc=av.prazo_utc,
            questoes=[
                QuestaoAlunoView(
                    id=q.id,
                    ordem=q.ordem,
                    tipo=q.tipo,
                    enunciado=q.enunciado,
                    conteudo=q.conteudo_jsonb,
                    alternativas=q.alternativas_jsonb,
                )
                for q in questoes
            ],
            submissao_id=sub.id if sub else None,
        )

    def aluno_create_submissao(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> SubmissaoResponse:
        if not user.aluno_id:
            raise forbidden()
        self.aluno_get_avaliacao(user, avaliacao_id)
        existing = self.db.scalar(
            select(Submissao).where(
                Submissao.avaliacao_id == avaliacao_id,
                Submissao.aluno_id == user.aluno_id,
            )
        )
        if existing:
            raise conflict("Submissão já existe")
        sub = Submissao(
            avaliacao_id=avaliacao_id,
            aluno_id=user.aluno_id,
            status=StatusSubmissao.rascunho,
        )
        self.db.add(sub)
        self.db.commit()
        self.db.refresh(sub)
        return SubmissaoResponse(
            id=sub.id,
            avaliacao_id=sub.avaliacao_id,
            status=sub.status,
            nota_decimal=sub.nota_decimal,
            enviada_em=sub.enviada_em,
        )

    def aluno_patch_submissao(
        self, user: CurrentUser, submissao_id: uuid.UUID, body: SubmissaoPatch
    ) -> SubmissaoResponse:
        sub = self._submissao_aluno(user, submissao_id)
        if sub.status != StatusSubmissao.rascunho:
            raise forbidden("Submissão não está em rascunho")
        for r in body.respostas:
            resp = self.db.scalar(
                select(RespostaQuestao).where(
                    RespostaQuestao.submissao_id == sub.id,
                    RespostaQuestao.questao_id == r.questao_id,
                )
            )
            valor = {}
            if r.valor_texto is not None:
                valor["texto"] = r.valor_texto
            if r.indice_selecionado is not None:
                valor["indice"] = r.indice_selecionado
            if resp:
                resp.valor_jsonb = valor
            else:
                self.db.add(
                    RespostaQuestao(
                        submissao_id=sub.id,
                        questao_id=r.questao_id,
                        valor_jsonb=valor,
                    )
                )
        self.db.commit()
        self.db.refresh(sub)
        return SubmissaoResponse(
            id=sub.id,
            avaliacao_id=sub.avaliacao_id,
            status=sub.status,
            nota_decimal=sub.nota_decimal,
            enviada_em=sub.enviada_em,
        )

    def aluno_enviar_submissao(self, user: CurrentUser, submissao_id: uuid.UUID) -> SubmissaoResponse:
        sub = self._submissao_aluno(user, submissao_id)
        if sub.status != StatusSubmissao.rascunho:
            raise conflict("Submissão já enviada")
        av = sub.avaliacao
        if av.prazo_utc and av.prazo_utc < datetime.now(UTC):
            raise forbidden("Prazo encerrado")
        sub.status = StatusSubmissao.enviada
        sub.enviada_em = datetime.now(UTC)
        self._corrigir_objetiva(sub)
        self.db.commit()
        self.db.refresh(sub)
        return SubmissaoResponse(
            id=sub.id,
            avaliacao_id=sub.avaliacao_id,
            status=sub.status,
            nota_decimal=sub.nota_decimal,
            enviada_em=sub.enviada_em,
        )

    def _submissao_aluno(self, user: CurrentUser, submissao_id: uuid.UUID) -> Submissao:
        if not user.aluno_id:
            raise forbidden()
        sub = self.db.get(Submissao, submissao_id)
        if not sub or sub.aluno_id != user.aluno_id:
            raise not_found()
        return sub

    def _corrigir_objetiva(self, sub: Submissao) -> None:
        questoes = self.db.scalars(
            select(Questao).where(Questao.avaliacao_id == sub.avaliacao_id)
        ).all()
        total_peso = Decimal("0")
        obtidos = Decimal("0")
        for q in questoes:
            total_peso += q.peso
            resp = self.db.scalar(
                select(RespostaQuestao).where(
                    RespostaQuestao.submissao_id == sub.id,
                    RespostaQuestao.questao_id == q.id,
                )
            )
            if not resp:
                continue
            if q.tipo == TipoQuestao.multipla_escolha and q.indice_gabarito is not None:
                idx = (resp.valor_jsonb or {}).get("indice")
                correta = idx == q.indice_gabarito
                resp.correta_flag = correta
                resp.pontos_obtidos = q.peso if correta else Decimal("0")
                if correta:
                    obtidos += q.peso
        if total_peso > 0:
            sub.nota_decimal = (obtidos / total_peso * Decimal("10")).quantize(Decimal("0.01"))
        sub.status = StatusSubmissao.corrigida
