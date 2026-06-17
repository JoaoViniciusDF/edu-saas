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
from app.models.governanca import (
    Aluno,
    AlunoResponsavel,
    Matricula,
    Professor,
    Turma,
    TurmaProfessor,
    UsuarioConta,
)
from app.schemas.avaliacoes import (
    AlunoAvaliacaoDisponivel,
    AlunoAvaliacaoView,
    AvaliacaoDuplicar,
    AvaliacaoPublicar,
    AvaliacaoReabrir,
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
    RespostaQuestaoInput,
    SituacaoAvaliacaoAluno,
    SubmissaoPatch,
    SubmissaoResumoProfessor,
    SubmissoesAvaliacaoProfessor,
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

    def _turma_acessivel(self, user: CurrentUser, turma_id: uuid.UUID) -> Turma:
        inst_id = self._inst_id(user)
        turma = self.db.get(Turma, turma_id)
        if not turma or turma.instituicao_id != inst_id:
            raise not_found()
        if user.perfil == TipoPerfil.professor and user.professor_id:
            vinculado = self.db.scalar(
                select(TurmaProfessor).where(
                    TurmaProfessor.turma_id == turma_id,
                    TurmaProfessor.professor_id == user.professor_id,
                )
            )
            if not vinculado and turma.professor_titular_id != user.professor_id:
                raise forbidden("Turma fora do seu escopo")
        return turma

    def _primeira_turma_professor(self, user: CurrentUser) -> uuid.UUID:
        if not user.professor_id:
            raise bad_request("Selecione uma turma")
        turma = self.db.scalar(
            select(Turma)
            .outerjoin(
                TurmaProfessor,
                (TurmaProfessor.turma_id == Turma.id)
                & (TurmaProfessor.professor_id == user.professor_id),
            )
            .where(
                Turma.instituicao_id == user.instituicao_id,
                (TurmaProfessor.id.isnot(None)) | (Turma.professor_titular_id == user.professor_id),
            )
            .order_by(Turma.nome)
            .limit(1)
        )
        if not turma:
            raise bad_request("Nenhuma turma vinculada ao professor")
        return turma.id

    def _turmas_ativas_aluno(self, aluno_id: uuid.UUID) -> list[uuid.UUID]:
        rows = self.db.scalars(
            select(Matricula.turma_id).where(
                Matricula.aluno_id == aluno_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
        ).all()
        return list(rows)

    def _aluno_acessa_avaliacao(self, aluno_id: uuid.UUID, av: Avaliacao) -> bool:
        turmas = self._turmas_ativas_aluno(aluno_id)
        return av.turma_id in turmas

    def _responsavel_acessa_aluno(self, responsavel_id: uuid.UUID, aluno_id: uuid.UUID) -> None:
        v = self.db.scalar(
            select(AlunoResponsavel).where(
                AlunoResponsavel.responsavel_id == responsavel_id,
                AlunoResponsavel.aluno_id == aluno_id,
            )
        )
        if not v:
            raise forbidden("Aluno fora do seu vínculo")

    def _situacao_aluno(
        self, av: Avaliacao, sub: Submissao | None, now: datetime
    ) -> SituacaoAvaliacaoAluno:
        if sub and sub.status in (
            StatusSubmissao.enviada,
            StatusSubmissao.corrigida,
        ):
            return "concluida"
        if av.status == StatusAvaliacao.encerrada:
            return "concluida"
        if av.prazo_utc and av.prazo_utc < now and av.status == StatusAvaliacao.publicada:
            return "concluida"
        if sub and sub.status == StatusSubmissao.rascunho:
            return "em_andamento"
        return "pendente"

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

    def get_arvore(
        self, user: CurrentUser, materia_id: uuid.UUID, turma_id: uuid.UUID | None = None
    ) -> ArvoreMateria:
        inst_id = self._inst_id(user)
        m = self._materia_tenant(materia_id, inst_id)
        if turma_id:
            self._turma_acessivel(user, turma_id)
        assuntos = list(
            self.db.scalars(
                select(Assunto).where(Assunto.materia_id == m.id).order_by(Assunto.ordem)
            ).all()
        )
        if not assuntos:
            return ArvoreMateria(id=m.id, nome=m.nome, assuntos=[])

        assunto_ids = [a.id for a in assuntos]
        pastas = list(
            self.db.scalars(
                select(PastaAvaliacoes)
                .where(PastaAvaliacoes.assunto_id.in_(assunto_ids))
                .order_by(PastaAvaliacoes.nome)
            ).all()
        )
        pastas_por_assunto: dict[uuid.UUID, list[PastaAvaliacoes]] = {}
        for p in pastas:
            pastas_por_assunto.setdefault(p.assunto_id, []).append(p)

        pasta_ids = [p.id for p in pastas]
        avs_por_pasta: dict[uuid.UUID, list[Avaliacao]] = {}
        if pasta_ids:
            stmt_av = select(Avaliacao).where(Avaliacao.pasta_id.in_(pasta_ids))
            if turma_id:
                stmt_av = stmt_av.where(Avaliacao.turma_id == turma_id)
            for av in self.db.scalars(stmt_av.order_by(Avaliacao.titulo)).all():
                avs_por_pasta.setdefault(av.pasta_id, []).append(av)

        turma_ids = {av.turma_id for avs in avs_por_pasta.values() for av in avs}
        turmas_nome: dict[uuid.UUID, str] = {}
        if turma_ids:
            for tid, nome in self.db.execute(
                select(Turma.id, Turma.nome).where(Turma.id.in_(turma_ids))
            ).all():
                turmas_nome[tid] = nome

        def avaliacao_item(av: Avaliacao) -> AvaliacaoListItem:
            return self._avaliacao_list_item(av, turmas_nome.get(av.turma_id))

        arvore_assuntos = []
        for a in assuntos:
            arvore_pastas = [
                ArvorePasta(
                    id=p.id,
                    nome=p.nome,
                    avaliacoes=[avaliacao_item(av) for av in avs_por_pasta.get(p.id, [])],
                )
                for p in pastas_por_assunto.get(a.id, [])
            ]
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

    def _avaliacao_list_item(
        self, av: Avaliacao, turma_nome: str | None = None
    ) -> AvaliacaoListItem:
        if turma_nome is None:
            turma = self.db.get(Turma, av.turma_id)
            turma_nome = turma.nome if turma else None
        total_sub = self.db.scalar(
            select(func.count()).select_from(Submissao).where(Submissao.avaliacao_id == av.id)
        )
        total_alunos = self.db.scalar(
            select(func.count())
            .select_from(Matricula)
            .where(
                Matricula.turma_id == av.turma_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
        )
        return AvaliacaoListItem(
            id=av.id,
            titulo=av.titulo,
            status=av.status,
            turma_id=av.turma_id,
            turma_nome=turma_nome,
            prazo_utc=av.prazo_utc,
            publicado_em=av.publicado_em,
            total_submissoes=total_sub or 0,
            total_alunos_turma=total_alunos or 0,
        )

    def list_avaliacoes_pasta(
        self, user: CurrentUser, pasta_id: uuid.UUID, turma_id: uuid.UUID | None = None
    ) -> list[AvaliacaoListItem]:
        self.get_pasta(user, pasta_id)
        if turma_id:
            self._turma_acessivel(user, turma_id)
        stmt = select(Avaliacao).where(Avaliacao.pasta_id == pasta_id)
        if turma_id:
            stmt = stmt.where(Avaliacao.turma_id == turma_id)
        rows = self.db.scalars(stmt).all()
        return [self._avaliacao_list_item(av) for av in rows]

    def create_avaliacao(
        self, user: CurrentUser, pasta_id: uuid.UUID, body: AvaliacaoCreate
    ) -> AvaliacaoDetail:
        self.get_pasta(user, pasta_id)
        if body.turma_id:
            tid = self._turma_acessivel(user, body.turma_id).id
        elif user.perfil == TipoPerfil.administrador:
            turma = self.db.scalar(
                select(Turma)
                .where(Turma.instituicao_id == self._inst_id(user))
                .order_by(Turma.nome)
                .limit(1)
            )
            if not turma:
                raise bad_request("Cadastre uma turma antes de criar avaliações")
            tid = turma.id
        else:
            tid = self._primeira_turma_professor(user)
        av = Avaliacao(
            pasta_id=pasta_id,
            turma_id=tid,
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

    def publicar(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: AvaliacaoPublicar
    ) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status != StatusAvaliacao.rascunho:
            raise conflict("Avaliação não está em rascunho")
        self._validate_questoes_publicar(list(av.questoes))
        turma = self._turma_acessivel(user, body.turma_id)
        av.turma_id = turma.id
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

    def inativar(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status not in (StatusAvaliacao.publicada, StatusAvaliacao.encerrada):
            raise conflict("Apenas avaliações publicadas ou encerradas podem ser inativadas")
        av.status = StatusAvaliacao.inativa
        av.encerrada_em = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(av)
        return self._avaliacao_detail(av)

    def apagar_avaliacao(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> None:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        self.db.delete(av)
        self.db.commit()

    def duplicar(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: AvaliacaoDuplicar
    ) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        origem = self._avaliacao_tenant(avaliacao_id, inst_id)
        pasta_id = body.pasta_id or origem.pasta_id
        pasta = self.db.get(PastaAvaliacoes, pasta_id)
        if not pasta:
            raise not_found()
        self._materia_tenant(pasta.assunto.materia_id, inst_id)
        questoes_origem = self.db.scalars(
            select(Questao).where(Questao.avaliacao_id == origem.id).order_by(Questao.ordem)
        ).all()
        nova = Avaliacao(
            pasta_id=pasta_id,
            turma_id=origem.turma_id,
            titulo=body.titulo or f"{origem.titulo} (cópia)",
            status=StatusAvaliacao.rascunho,
            prazo_utc=origem.prazo_utc,
            payload_editor_jsonb=origem.payload_editor_jsonb,
            instrucoes_jsonb=origem.instrucoes_jsonb,
            versao=1,
        )
        self.db.add(nova)
        self.db.flush()
        for q in questoes_origem:
            self.db.add(
                Questao(
                    avaliacao_id=nova.id,
                    ordem=q.ordem,
                    tipo=q.tipo,
                    enunciado=q.enunciado,
                    conteudo_jsonb=q.conteudo_jsonb,
                    alternativas_jsonb=q.alternativas_jsonb,
                    indice_gabarito=q.indice_gabarito,
                    peso=q.peso,
                )
            )
        self.db.commit()
        self.db.refresh(nova)
        return self._avaliacao_detail(nova)

    def reabrir_avaliacao(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, body: AvaliacaoReabrir
    ) -> AvaliacaoDetail:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if av.status not in (StatusAvaliacao.encerrada, StatusAvaliacao.inativa):
            raise conflict("Apenas avaliações encerradas ou inativas podem ser reabertas")
        av.status = StatusAvaliacao.publicada
        av.encerrada_em = None
        if body.prazo_utc is not None:
            av.prazo_utc = body.prazo_utc
        if not av.publicado_em:
            av.publicado_em = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(av)
        return self._avaliacao_detail(av)

    def reabrir_submissao_aluno(
        self, user: CurrentUser, submissao_id: uuid.UUID
    ) -> SubmissaoResponse:
        inst_id = self._inst_id(user)
        sub = self.db.get(Submissao, submissao_id)
        if not sub:
            raise not_found()
        self._avaliacao_tenant(sub.avaliacao_id, inst_id)
        respostas = self.db.scalars(
            select(RespostaQuestao).where(RespostaQuestao.submissao_id == sub.id)
        ).all()
        for r in respostas:
            self.db.delete(r)
        sub.status = StatusSubmissao.rascunho
        sub.nota_decimal = None
        sub.enviada_em = None
        self.db.commit()
        self.db.refresh(sub)
        return self._submissao_response(sub)

    def listar_submissoes_avaliacao(
        self, user: CurrentUser, avaliacao_id: uuid.UUID
    ) -> SubmissoesAvaliacaoProfessor:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        now = datetime.now(UTC)
        matriculas = self.db.scalars(
            select(Matricula)
            .where(
                Matricula.turma_id == av.turma_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
            .order_by(Matricula.id)
        ).all()
        aluno_ids = [m.aluno_id for m in matriculas]
        subs_map: dict[uuid.UUID, Submissao] = {}
        if aluno_ids:
            subs = self.db.scalars(
                select(Submissao).where(
                    Submissao.avaliacao_id == av.id,
                    Submissao.aluno_id.in_(aluno_ids),
                )
            ).all()
            subs_map = {s.aluno_id: s for s in subs}
        alunos: list[SubmissaoResumoProfessor] = []
        concluidas = 0
        for aluno_id in aluno_ids:
            aluno = self.db.get(Aluno, aluno_id)
            usuario = self.db.get(UsuarioConta, aluno.usuario_id) if aluno else None
            nome = usuario.nome_exibicao if usuario else "Aluno"
            sub = subs_map.get(aluno_id)
            situacao = self._situacao_aluno(av, sub, now)
            if situacao == "concluida":
                concluidas += 1
            alunos.append(
                SubmissaoResumoProfessor(
                    submissao_id=sub.id if sub else None,
                    aluno_id=aluno_id,
                    aluno_nome=nome,
                    situacao=situacao,
                    status_submissao=sub.status if sub else None,
                    nota_decimal=sub.nota_decimal if sub else None,
                    percentual_acerto=self._percentual_from_nota(
                        sub.nota_decimal if sub else None
                    ),
                    enviada_em=sub.enviada_em if sub else None,
                )
            )
        total = len(aluno_ids)
        return SubmissoesAvaliacaoProfessor(
            total_alunos=total,
            total_concluidas=concluidas,
            total_pendentes=total - concluidas,
            alunos=alunos,
        )

    def professor_get_submissao_avaliacao(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, aluno_id: uuid.UUID
    ) -> AlunoAvaliacaoView:
        inst_id = self._inst_id(user)
        av = self._avaliacao_tenant(avaliacao_id, inst_id)
        if not self._aluno_acessa_avaliacao(aluno_id, av):
            raise not_found()
        return self._build_aluno_avaliacao_view(
            av, aluno_id, somente_leitura_forcado=True, visao_professor=True
        )

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
        turma = self.db.get(Turma, av.turma_id)
        return AvaliacaoDetail(
            id=av.id,
            pasta_id=av.pasta_id,
            titulo=av.titulo,
            status=av.status,
            turma_id=av.turma_id,
            turma_nome=turma.nome if turma else None,
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

    def _listar_avaliacoes_aluno(
        self, aluno_id: uuid.UUID, inst_id: uuid.UUID
    ) -> list[AlunoAvaliacaoDisponivel]:
        now = datetime.now(UTC)
        turmas = self._turmas_ativas_aluno(aluno_id)
        if not turmas:
            return []
        avs = self.db.scalars(
            select(Avaliacao)
            .join(PastaAvaliacoes, Avaliacao.pasta_id == PastaAvaliacoes.id)
            .join(Assunto, PastaAvaliacoes.assunto_id == Assunto.id)
            .join(MateriaCurricular, Assunto.materia_id == MateriaCurricular.id)
            .where(
                MateriaCurricular.instituicao_id == inst_id,
                Avaliacao.turma_id.in_(turmas),
                Avaliacao.status.in_(
                    (StatusAvaliacao.publicada, StatusAvaliacao.encerrada)
                ),
            )
            .order_by(Avaliacao.publicado_em.desc().nulls_last(), Avaliacao.titulo)
        ).all()
        result: list[AlunoAvaliacaoDisponivel] = []
        for av in avs:
            sub = self.db.scalar(
                select(Submissao).where(
                    Submissao.avaliacao_id == av.id,
                    Submissao.aluno_id == aluno_id,
                )
            )
            situacao = self._situacao_aluno(av, sub, now)
            turma = self.db.get(Turma, av.turma_id)
            result.append(
                AlunoAvaliacaoDisponivel(
                    id=av.id,
                    titulo=av.titulo,
                    turma_id=av.turma_id,
                    turma_nome=turma.nome if turma else "",
                    prazo_utc=av.prazo_utc,
                    status_avaliacao=av.status,
                    status_submissao=sub.status if sub else None,
                    situacao=situacao,
                    nota_decimal=sub.nota_decimal if sub else None,
                    percentual_acerto=self._percentual_from_nota(
                        sub.nota_decimal if sub else None
                    ),
                )
            )
        return result

    def aluno_disponiveis(self, user: CurrentUser) -> list[AlunoAvaliacaoDisponivel]:
        if not user.aluno_id or not user.instituicao_id:
            raise forbidden()
        return self._listar_avaliacoes_aluno(user.aluno_id, user.instituicao_id)

    def responsavel_avaliacoes_dependente(
        self, user: CurrentUser, aluno_id: uuid.UUID
    ) -> list[AlunoAvaliacaoDisponivel]:
        if not user.responsavel_id or not user.instituicao_id:
            raise forbidden()
        self._responsavel_acessa_aluno(user.responsavel_id, aluno_id)
        return self._listar_avaliacoes_aluno(aluno_id, user.instituicao_id)

    def _respostas_submissao(self, sub: Submissao | None) -> list[RespostaQuestaoInput]:
        if not sub:
            return []
        rows = self.db.scalars(
            select(RespostaQuestao).where(RespostaQuestao.submissao_id == sub.id)
        ).all()
        out: list[RespostaQuestaoInput] = []
        for r in rows:
            valor = r.valor_jsonb or {}
            out.append(
                RespostaQuestaoInput(
                    questao_id=r.questao_id,
                    valor_texto=valor.get("texto"),
                    indice_selecionado=valor.get("indice"),
                )
            )
        return out

    @staticmethod
    def _percentual_from_nota(nota: Decimal | None) -> float | None:
        if nota is None:
            return None
        return float((nota / Decimal("10") * Decimal("100")).quantize(Decimal("0.01")))

    def _respostas_map(self, sub: Submissao | None) -> dict[uuid.UUID, RespostaQuestao]:
        if not sub:
            return {}
        rows = self.db.scalars(
            select(RespostaQuestao).where(RespostaQuestao.submissao_id == sub.id)
        ).all()
        return {r.questao_id: r for r in rows}

    def _submissao_response(self, sub: Submissao) -> SubmissaoResponse:
        return SubmissaoResponse(
            id=sub.id,
            avaliacao_id=sub.avaliacao_id,
            status=sub.status,
            nota_decimal=sub.nota_decimal,
            percentual_acerto=self._percentual_from_nota(sub.nota_decimal),
            enviada_em=sub.enviada_em,
        )

    def _questoes_aluno_view(
        self,
        questoes: list[Questao],
        sub: Submissao | None,
        *,
        exibir_indice_gabarito: bool,
        exibir_respostas_aluno: bool = False,
        calcular_acertos: bool = False,
    ) -> list[QuestaoAlunoView]:
        resp_map = self._respostas_map(sub) if exibir_respostas_aluno else {}
        views: list[QuestaoAlunoView] = []
        for q in questoes:
            indice_aluno: int | None = None
            indice_gabarito: int | None = None
            acertou: bool | None = None
            if exibir_respostas_aluno:
                resp = resp_map.get(q.id)
                if resp and resp.valor_jsonb:
                    indice_aluno = resp.valor_jsonb.get("indice")
            if exibir_indice_gabarito and q.tipo == TipoQuestao.multipla_escolha:
                if q.indice_gabarito is not None:
                    indice_gabarito = q.indice_gabarito
                if calcular_acertos:
                    resp = resp_map.get(q.id)
                    if resp is not None and resp.correta_flag is not None:
                        acertou = bool(resp.correta_flag)
                    elif indice_aluno is not None and q.indice_gabarito is not None:
                        acertou = indice_aluno == q.indice_gabarito
            views.append(
                QuestaoAlunoView(
                    id=q.id,
                    ordem=q.ordem,
                    tipo=q.tipo,
                    enunciado=q.enunciado,
                    conteudo=q.conteudo_jsonb,
                    alternativas=q.alternativas_jsonb,
                    indice_resposta_aluno=indice_aluno,
                    indice_gabarito=indice_gabarito,
                    acertou=acertou,
                )
            )
        return views

    def _contagem_acertos(self, questoes: list[QuestaoAlunoView]) -> int:
        return sum(1 for q in questoes if q.acertou is True)

    def _build_aluno_avaliacao_view(
        self,
        av: Avaliacao,
        aluno_id: uuid.UUID,
        somente_leitura_forcado: bool = False,
        exibir_gabarito_forcado: bool = False,
        visao_professor: bool = False,
    ) -> AlunoAvaliacaoView:
        if not self._aluno_acessa_avaliacao(aluno_id, av):
            raise not_found()
        if not visao_professor and av.status not in (
            StatusAvaliacao.publicada,
            StatusAvaliacao.encerrada,
        ):
            raise not_found()
        now = datetime.now(UTC)
        questoes = self.db.scalars(
            select(Questao).where(Questao.avaliacao_id == av.id).order_by(Questao.ordem)
        ).all()
        sub = self.db.scalar(
            select(Submissao).where(
                Submissao.avaliacao_id == av.id,
                Submissao.aluno_id == aluno_id,
            )
        )
        situacao = self._situacao_aluno(av, sub, now)
        somente_leitura = somente_leitura_forcado or situacao == "concluida"
        if (
            not somente_leitura
            and not visao_professor
            and av.prazo_utc
            and av.prazo_utc < now
            and av.status == StatusAvaliacao.publicada
        ):
            raise forbidden("Prazo encerrado")
        concluida = situacao == "concluida"
        if visao_professor:
            exibir_indice_gabarito = True
            exibir_respostas_aluno = True
            calcular_acertos = concluida
            exibir_gabarito = True
        elif exibir_gabarito_forcado:
            exibir_indice_gabarito = True
            exibir_respostas_aluno = concluida
            calcular_acertos = concluida
            exibir_gabarito = True
        else:
            exibir_indice_gabarito = concluida
            exibir_respostas_aluno = concluida
            calcular_acertos = concluida
            exibir_gabarito = concluida
        questoes_view = self._questoes_aluno_view(
            list(questoes),
            sub,
            exibir_indice_gabarito=exibir_indice_gabarito,
            exibir_respostas_aluno=exibir_respostas_aluno,
            calcular_acertos=calcular_acertos,
        )
        questoes_corretas = (
            self._contagem_acertos(questoes_view) if calcular_acertos else 0
        )
        return AlunoAvaliacaoView(
            id=av.id,
            titulo=av.titulo,
            prazo_utc=av.prazo_utc,
            questoes=questoes_view,
            submissao_id=sub.id if sub else None,
            status_submissao=sub.status if sub else None,
            situacao=situacao,
            somente_leitura=somente_leitura,
            exibir_gabarito=exibir_gabarito,
            nota_decimal=sub.nota_decimal if sub and concluida else None,
            percentual_acerto=self._percentual_from_nota(
                sub.nota_decimal if sub and concluida else None
            ),
            total_questoes=len(questoes_view),
            questoes_corretas=questoes_corretas,
            respostas=self._respostas_submissao(sub) if sub and exibir_respostas_aluno else [],
        )

    def aluno_get_avaliacao(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> AlunoAvaliacaoView:
        if not user.aluno_id:
            raise forbidden()
        av = self.db.get(Avaliacao, avaliacao_id)
        if not av:
            raise not_found()
        return self._build_aluno_avaliacao_view(av, user.aluno_id)

    def responsavel_get_avaliacao_dependente(
        self, user: CurrentUser, avaliacao_id: uuid.UUID, aluno_id: uuid.UUID
    ) -> AlunoAvaliacaoView:
        if not user.responsavel_id:
            raise forbidden()
        self._responsavel_acessa_aluno(user.responsavel_id, aluno_id)
        av = self.db.get(Avaliacao, avaliacao_id)
        if not av:
            raise not_found()
        return self._build_aluno_avaliacao_view(
            av, aluno_id, somente_leitura_forcado=True, exibir_gabarito_forcado=True
        )

    def aluno_create_submissao(self, user: CurrentUser, avaliacao_id: uuid.UUID) -> SubmissaoResponse:
        if not user.aluno_id:
            raise forbidden()
        view = self.aluno_get_avaliacao(user, avaliacao_id)
        if view.somente_leitura:
            raise forbidden("Avaliação não pode ser editada")
        existing = self.db.scalar(
            select(Submissao).where(
                Submissao.avaliacao_id == avaliacao_id,
                Submissao.aluno_id == user.aluno_id,
            )
        )
        if existing:
            # Idempotente: devolve a submissão já existente deste aluno em vez de
            # falhar, evitando que o cliente fique com um id de submissão órfão.
            return self._submissao_response(existing)
        sub = Submissao(
            avaliacao_id=avaliacao_id,
            aluno_id=user.aluno_id,
            status=StatusSubmissao.rascunho,
        )
        self.db.add(sub)
        self.db.commit()
        self.db.refresh(sub)
        return self._submissao_response(sub)

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
        return self._submissao_response(sub)

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
        return self._submissao_response(sub)

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
