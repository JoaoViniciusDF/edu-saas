from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import CurrentUser
from app.core.exceptions import bad_request, forbidden
from app.models.avaliacoes import (
    Assunto,
    Avaliacao,
    MateriaCurricular,
    PastaAvaliacoes,
    Submissao,
)
from app.models.comunicados import Comunicado, Notificacao
from app.models.conteudo import MaterialEstudo
from app.models.enums import (
    SituacaoMatricula,
    StatusAvaliacao,
    StatusSubmissao,
    TipoPerfil,
)
from app.models.governanca import Aluno, AlunoResponsavel, Matricula, Turma, TurmaProfessor
from app.schemas.dashboard import (
    DashboardDesempenhoAvaliacoesResponse,
    DashboardResumo,
    DashboardSerieItem,
    DashboardSeriesResponse,
    DesempenhoAssuntoItem,
    DesempenhoAvaliacaoItem,
    DesempenhoMateriaItem,
    NotificacaoItem,
    SearchHit,
)


APROVACAO_MINIMA = Decimal("6")


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _filtros_por_escopo(
        escopo: str | None,
        turma_id: uuid.UUID | None,
        aluno_id: uuid.UUID | None,
    ) -> tuple[uuid.UUID | None, uuid.UUID | None]:
        if escopo == "turma":
            return turma_id, None
        if escopo == "aluno":
            return None, aluno_id
        return None, None

    def _professor_turma_ids(self, user: CurrentUser) -> list[uuid.UUID]:
        if not user.professor_id or not user.instituicao_id:
            return []
        rows = self.db.scalars(
            select(Turma.id)
            .outerjoin(
                TurmaProfessor,
                (TurmaProfessor.turma_id == Turma.id)
                & (TurmaProfessor.professor_id == user.professor_id),
            )
            .where(
                Turma.instituicao_id == user.instituicao_id,
                (TurmaProfessor.id.isnot(None))
                | (Turma.professor_titular_id == user.professor_id),
            )
        ).all()
        return list(rows)

    def _validar_turma_professor(
        self, user: CurrentUser, turma_id: uuid.UUID | None
    ) -> uuid.UUID | None:
        if user.perfil != TipoPerfil.professor:
            return turma_id
        ids = self._professor_turma_ids(user)
        if not ids:
            return turma_id
        if turma_id and turma_id not in ids:
            raise forbidden("Turma fora do seu escopo")
        return turma_id

    def _resolver_escopo(
        self,
        user: CurrentUser,
        escopo: str | None,
        turma_id: uuid.UUID | None,
        aluno_id: uuid.UUID | None,
    ) -> tuple[uuid.UUID | None, uuid.UUID | None, list[uuid.UUID] | None]:
        """Resolve escopo/perfil em (turma_id, aluno_id, lista de alunos do escopo).

        ``aluno_ids_filtro`` é ``None`` quando não há restrição por aluno
        (admin/professor em escopo amplo) e uma lista (possivelmente vazia)
        quando o escopo limita os alunos visíveis.
        """
        turma_id, aluno_id = self._filtros_por_escopo(escopo, turma_id, aluno_id)
        turma_id = self._validar_turma_professor(user, turma_id)

        aluno_ids_filtro: list[uuid.UUID] | None = None
        if aluno_id:
            aluno_ids_filtro = [aluno_id]
        elif user.perfil == TipoPerfil.responsavel and user.responsavel_id:
            aluno_ids_filtro = list(
                self.db.scalars(
                    select(AlunoResponsavel.aluno_id).where(
                        AlunoResponsavel.responsavel_id == user.responsavel_id
                    )
                ).all()
            )
        elif turma_id:
            aluno_ids_filtro = list(
                self.db.scalars(
                    select(Matricula.aluno_id).where(
                        Matricula.turma_id == turma_id,
                        Matricula.situacao == SituacaoMatricula.ativa,
                    )
                ).all()
            )
        return turma_id, aluno_id, aluno_ids_filtro

    def _turma_ids_escopo(
        self,
        user: CurrentUser,
        turma_id: uuid.UUID | None,
        aluno_ids_filtro: list[uuid.UUID] | None,
    ) -> list[uuid.UUID] | None:
        """Turmas relevantes ao escopo. ``None`` significa "todas da instituição"."""
        if turma_id:
            return [turma_id]
        if aluno_ids_filtro is not None:
            if not aluno_ids_filtro:
                return []
            return list(
                self.db.scalars(
                    select(Matricula.turma_id)
                    .where(
                        Matricula.aluno_id.in_(aluno_ids_filtro),
                        Matricula.situacao == SituacaoMatricula.ativa,
                    )
                    .distinct()
                ).all()
            )
        if user.perfil == TipoPerfil.professor:
            return self._professor_turma_ids(user)
        return None

    def _filtrar_submissoes(
        self,
        stmt,
        user: CurrentUser,
        inst_id: uuid.UUID | None,
        turma_id: uuid.UUID | None,
        aluno_ids_filtro: list[uuid.UUID] | None,
        data_inicio: date | None,
        data_fim: date | None,
    ):
        """Aplica filtros de instituição/turma/aluno/período a uma query que já
        possui ``Submissao`` e ``Avaliacao`` no join."""
        stmt = stmt.join(Turma, Avaliacao.turma_id == Turma.id)
        if inst_id:
            stmt = stmt.where(Turma.instituicao_id == inst_id)
        if turma_id:
            stmt = stmt.where(Avaliacao.turma_id == turma_id)
        if aluno_ids_filtro is not None:
            stmt = stmt.where(Submissao.aluno_id.in_(aluno_ids_filtro))
        elif user.perfil == TipoPerfil.professor:
            prof_turmas = self._professor_turma_ids(user)
            if prof_turmas:
                stmt = stmt.where(Avaliacao.turma_id.in_(prof_turmas))
        if data_inicio:
            stmt = stmt.where(
                func.coalesce(Submissao.enviada_em, Submissao.iniciada_em)
                >= datetime.combine(data_inicio, datetime.min.time())
            )
        if data_fim:
            stmt = stmt.where(
                func.coalesce(Submissao.enviada_em, Submissao.iniciada_em)
                <= datetime.combine(data_fim, datetime.max.time())
            )
        return stmt

    def _contar_alunos_escopo(
        self,
        inst_id: uuid.UUID | None,
        turma_ids_escopo: list[uuid.UUID] | None,
        aluno_ids_filtro: list[uuid.UUID] | None,
    ) -> int:
        if aluno_ids_filtro is not None:
            return len(set(aluno_ids_filtro))
        q = (
            select(func.count(func.distinct(Matricula.aluno_id)))
            .join(Turma, Matricula.turma_id == Turma.id)
            .where(Matricula.situacao == SituacaoMatricula.ativa)
        )
        if inst_id:
            q = q.where(Turma.instituicao_id == inst_id)
        if turma_ids_escopo is not None:
            if not turma_ids_escopo:
                return 0
            q = q.where(Matricula.turma_id.in_(turma_ids_escopo))
        return self.db.scalar(q) or 0

    def _nome_disciplina(self, disciplina_id: uuid.UUID | None) -> str:
        if not disciplina_id:
            return "Geral"
        materia = self.db.get(MateriaCurricular, disciplina_id)
        return materia.nome if materia else "Disciplina"

    def resumo(
        self,
        user: CurrentUser,
        escopo: str | None = None,
        turma_id: uuid.UUID | None = None,
        aluno_id: uuid.UUID | None = None,
        data_inicio: date | None = None,
        data_fim: date | None = None,
    ) -> DashboardResumo:
        if user.perfil == TipoPerfil.aluno:
            raise forbidden()
        inst_id = user.instituicao_id
        if not inst_id and user.perfil != TipoPerfil.super_admin:
            raise forbidden()

        turma_id, _aluno_id, aluno_ids_filtro = self._resolver_escopo(
            user, escopo, turma_id, aluno_id
        )

        # Média/taxa calculadas a partir das notas reais das submissões corrigidas.
        notas_stmt = (
            select(Submissao.nota_decimal, Submissao.aluno_id)
            .join(Avaliacao, Submissao.avaliacao_id == Avaliacao.id)
            .where(
                Submissao.status.in_(
                    (
                        StatusSubmissao.corrigida,
                        StatusSubmissao.corrigida_parcialmente,
                    )
                ),
                Submissao.nota_decimal.isnot(None),
                Avaliacao.status.in_(
                    (StatusAvaliacao.publicada, StatusAvaliacao.encerrada)
                ),
            )
        )
        notas_stmt = self._filtrar_submissoes(
            notas_stmt, user, inst_id, turma_id, aluno_ids_filtro, data_inicio, data_fim
        )
        rows = self.db.execute(notas_stmt).all()
        notas = [n for n, _ in rows if n is not None]

        media: Decimal | None = None
        taxa: Decimal | None = None
        if notas:
            media = sum(notas, Decimal("0")) / len(notas)
            aprovados = sum(1 for n in notas if n >= APROVACAO_MINIMA)
            taxa = Decimal(aprovados) / Decimal(len(notas))

        # Submissões enviadas e ainda não corrigidas (pendências reais).
        pend_stmt = (
            select(func.count())
            .select_from(Submissao)
            .join(Avaliacao, Submissao.avaliacao_id == Avaliacao.id)
            .where(Submissao.status == StatusSubmissao.enviada)
        )
        pend_stmt = self._filtrar_submissoes(
            pend_stmt, user, inst_id, turma_id, aluno_ids_filtro, data_inicio, data_fim
        )
        pendentes = self.db.scalar(pend_stmt) or 0

        turma_ids_escopo = self._turma_ids_escopo(user, turma_id, aluno_ids_filtro)
        total_alunos = self._contar_alunos_escopo(
            inst_id, turma_ids_escopo, aluno_ids_filtro
        )

        insights: list[str] = []
        if pendentes:
            insights.append(f"{pendentes} submissões aguardando correção")
        if media is not None:
            insights.append(f"Média geral no período: {media:.2f}")
        else:
            insights.append("Nenhuma avaliação corrigida no período")

        return DashboardResumo(
            media_geral=media,
            taxa_aprovacao=taxa,
            pendentes_correcao=pendentes,
            total_alunos_escopo=total_alunos,
            insights=insights,
        )

    def series(
        self,
        user: CurrentUser,
        escopo: str | None = None,
        turma_id: uuid.UUID | None = None,
        aluno_id: uuid.UUID | None = None,
        data_inicio: date | None = None,
        data_fim: date | None = None,
    ) -> DashboardSeriesResponse:
        if user.perfil == TipoPerfil.aluno:
            raise forbidden()
        inst_id = user.instituicao_id
        if not inst_id and user.perfil != TipoPerfil.super_admin:
            raise forbidden()

        turma_id, _aluno_id, aluno_ids_filtro = self._resolver_escopo(
            user, escopo, turma_id, aluno_id
        )

        # Evolução mensal real, agrupada por (mês, matéria) das submissões corrigidas.
        stmt = (
            select(Submissao, Avaliacao, MateriaCurricular)
            .join(Avaliacao, Submissao.avaliacao_id == Avaliacao.id)
            .join(PastaAvaliacoes, Avaliacao.pasta_id == PastaAvaliacoes.id)
            .join(Assunto, PastaAvaliacoes.assunto_id == Assunto.id)
            .join(MateriaCurricular, Assunto.materia_id == MateriaCurricular.id)
            .where(
                Submissao.status.in_(
                    (
                        StatusSubmissao.corrigida,
                        StatusSubmissao.corrigida_parcialmente,
                    )
                ),
                Submissao.nota_decimal.isnot(None),
                Avaliacao.status.in_(
                    (StatusAvaliacao.publicada, StatusAvaliacao.encerrada)
                ),
            )
        )
        stmt = self._filtrar_submissoes(
            stmt, user, inst_id, turma_id, aluno_ids_filtro, data_inicio, data_fim
        )
        rows = self.db.execute(stmt).all()

        grupos: dict[tuple[date, uuid.UUID], dict] = {}
        for sub, _av, materia in rows:
            ref = sub.enviada_em or sub.iniciada_em
            periodo = date(ref.year, ref.month, 1)
            chave = (periodo, materia.id)
            grupo = grupos.setdefault(
                chave,
                {"periodo": periodo, "materia": materia.nome, "notas": []},
            )
            grupo["notas"].append(sub.nota_decimal)

        items: list[DashboardSerieItem] = []
        for grupo in sorted(grupos.values(), key=lambda g: (g["periodo"], g["materia"])):
            notas = grupo["notas"]
            media = sum(notas, Decimal("0")) / len(notas)
            items.append(
                DashboardSerieItem(
                    periodo=grupo["periodo"],
                    disciplina=grupo["materia"],
                    media=media,
                )
            )
        return DashboardSeriesResponse(items=items)

    def search(
        self,
        user: CurrentUser,
        q: str,
        types: str | None = None,
    ) -> list[SearchHit]:
        if len(q.strip()) < 2:
            raise bad_request("Busca exige ao menos 2 caracteres")
        pattern = f"%{q.strip()}%"
        allowed = set((types or "comunicado,material,avaliacao").split(","))
        hits: list[SearchHit] = []
        inst_id = user.instituicao_id

        if "comunicado" in allowed and inst_id:
            rows = self.db.scalars(
                select(Comunicado)
                .where(
                    Comunicado.instituicao_id == inst_id,
                    or_(Comunicado.titulo.ilike(pattern), Comunicado.corpo.ilike(pattern)),
                )
                .limit(20)
            ).all()
            for c in rows:
                hits.append(
                    SearchHit(
                        id=c.id,
                        tipo="comunicado",
                        titulo=c.titulo,
                        subtitulo=c.corpo[:80],
                        url_deep_link=f"/comunicados/{c.id}",
                    )
                )

        if "material" in allowed and inst_id:
            from app.models.conteudo import PastaConteudo

            rows = self.db.scalars(
                select(MaterialEstudo)
                .join(PastaConteudo, MaterialEstudo.pasta_conteudo_id == PastaConteudo.id)
                .where(
                    PastaConteudo.instituicao_id == inst_id,
                    or_(
                        MaterialEstudo.titulo.ilike(pattern),
                        MaterialEstudo.descricao.ilike(pattern),
                    ),
                )
                .limit(20)
            ).all()
            for m in rows:
                hits.append(
                    SearchHit(
                        id=m.id,
                        tipo="material",
                        titulo=m.titulo,
                        subtitulo=m.descricao,
                        url_deep_link=f"/conteudo/materiais/{m.id}",
                    )
                )

        if "avaliacao" in allowed and inst_id:
            av_stmt = select(Avaliacao).where(Avaliacao.titulo.ilike(pattern))
            if user.perfil == TipoPerfil.professor:
                prof_turmas = self._professor_turma_ids(user)
                if prof_turmas:
                    av_stmt = av_stmt.where(Avaliacao.turma_id.in_(prof_turmas))
            rows = self.db.scalars(av_stmt.limit(20)).all()
            for av in rows:
                hits.append(
                    SearchHit(
                        id=av.id,
                        tipo="avaliacao",
                        titulo=av.titulo,
                        url_deep_link=f"/avaliacoes/avaliacoes/{av.id}",
                    )
                )

        return hits[:50]

    def list_notificacoes(self, user: CurrentUser) -> list[NotificacaoItem]:
        rows = self.db.scalars(
            select(Notificacao)
            .where(Notificacao.usuario_id == user.id)
            .order_by(Notificacao.criado_em.desc())
            .limit(100)
        ).all()
        return [
            NotificacaoItem(
                id=n.id,
                titulo=n.titulo,
                corpo_curto=n.corpo_curto,
                tipo_evento=n.tipo_evento,
                lida_flag=n.lida_flag,
                link_profundo=n.link_profundo,
                criado_em=n.criado_em.isoformat() if n.criado_em else None,
            )
            for n in rows
        ]

    def marcar_notificacao_lida(self, user: CurrentUser, notif_id: uuid.UUID) -> None:
        n = self.db.get(Notificacao, notif_id)
        if not n or n.usuario_id != user.id:
            from app.core.exceptions import not_found

            raise not_found()
        n.lida_flag = True
        self.db.commit()

    def marcar_todas_lidas(self, user: CurrentUser) -> None:
        rows = self.db.scalars(
            select(Notificacao).where(
                Notificacao.usuario_id == user.id,
                Notificacao.lida_flag.is_(False),
            )
        ).all()
        for n in rows:
            n.lida_flag = True
        self.db.commit()

    @staticmethod
    def _percentual_nota(nota: Decimal | None) -> float | None:
        if nota is None:
            return None
        return float((nota / Decimal("10") * Decimal("100")).quantize(Decimal("0.01")))

    def desempenho_avaliacoes(
        self,
        user: CurrentUser,
        escopo: str | None = None,
        turma_id: uuid.UUID | None = None,
        aluno_id: uuid.UUID | None = None,
        data_inicio: date | None = None,
        data_fim: date | None = None,
    ) -> DashboardDesempenhoAvaliacoesResponse:
        if user.perfil == TipoPerfil.aluno:
            raise forbidden()
        inst_id = user.instituicao_id
        if not inst_id and user.perfil != TipoPerfil.super_admin:
            raise forbidden()

        turma_id, aluno_id, aluno_ids_filtro = self._resolver_escopo(
            user, escopo, turma_id, aluno_id
        )

        stmt = (
            select(Submissao, Avaliacao, MateriaCurricular, Assunto)
            .join(Avaliacao, Submissao.avaliacao_id == Avaliacao.id)
            .join(PastaAvaliacoes, Avaliacao.pasta_id == PastaAvaliacoes.id)
            .join(Assunto, PastaAvaliacoes.assunto_id == Assunto.id)
            .join(MateriaCurricular, Assunto.materia_id == MateriaCurricular.id)
            .where(
                Submissao.status.in_(
                    (
                        StatusSubmissao.corrigida,
                        StatusSubmissao.enviada,
                        StatusSubmissao.corrigida_parcialmente,
                    )
                ),
                Avaliacao.status.in_(
                    (StatusAvaliacao.publicada, StatusAvaliacao.encerrada)
                ),
            )
            .options(joinedload(Submissao.aluno).joinedload(Aluno.usuario))
        )
        if inst_id:
            stmt = stmt.where(MateriaCurricular.instituicao_id == inst_id)
        if turma_id:
            stmt = stmt.where(Avaliacao.turma_id == turma_id)
        if aluno_ids_filtro is not None:
            if not aluno_ids_filtro:
                return DashboardDesempenhoAvaliacoesResponse(materias=[])
            stmt = stmt.where(Submissao.aluno_id.in_(aluno_ids_filtro))
        elif user.perfil == TipoPerfil.professor:
            prof_turmas = self._professor_turma_ids(user)
            if prof_turmas:
                stmt = stmt.where(Avaliacao.turma_id.in_(prof_turmas))
        if data_inicio:
            stmt = stmt.where(
                func.coalesce(Submissao.enviada_em, Submissao.iniciada_em)
                >= datetime.combine(data_inicio, datetime.min.time())
            )
        if data_fim:
            stmt = stmt.where(
                func.coalesce(Submissao.enviada_em, Submissao.iniciada_em)
                <= datetime.combine(data_fim, datetime.max.time())
            )

        rows = self.db.execute(stmt).all()

        materias_map: dict[uuid.UUID, dict] = {}
        for sub, av, materia, assunto in rows:
            pct = self._percentual_nota(sub.nota_decimal)
            aluno_nome = None
            if sub.aluno and sub.aluno.usuario:
                aluno_nome = sub.aluno.usuario.nome_exibicao
            situacao = (
                "concluida"
                if sub.status
                in (
                    StatusSubmissao.corrigida,
                    StatusSubmissao.enviada,
                    StatusSubmissao.corrigida_parcialmente,
                )
                else "pendente"
            )
            item = DesempenhoAvaliacaoItem(
                id=av.id,
                titulo=av.titulo,
                percentual=pct,
                nota_decimal=sub.nota_decimal,
                situacao=situacao,
                enviada_em=sub.enviada_em,
                aluno_nome=aluno_nome if not aluno_id else None,
            )
            if materia.id not in materias_map:
                materias_map[materia.id] = {
                    "id": materia.id,
                    "nome": materia.nome,
                    "assuntos": {},
                }
            assuntos = materias_map[materia.id]["assuntos"]
            if assunto.id not in assuntos:
                assuntos[assunto.id] = {
                    "id": assunto.id,
                    "nome": assunto.nome,
                    "avaliacoes": [],
                    "percentuais": [],
                }
            assuntos[assunto.id]["avaliacoes"].append(item)
            if pct is not None:
                assuntos[assunto.id]["percentuais"].append(pct)

        # Inclui matérias/assuntos com avaliações no escopo mesmo sem nota,
        # para que apareçam no gráfico "Desempenho por matéria" com média 0.
        turma_ids_escopo = self._turma_ids_escopo(user, turma_id, aluno_ids_filtro)
        av_stmt = (
            select(MateriaCurricular, Assunto, Avaliacao)
            .join(Assunto, Assunto.materia_id == MateriaCurricular.id)
            .join(PastaAvaliacoes, PastaAvaliacoes.assunto_id == Assunto.id)
            .join(Avaliacao, Avaliacao.pasta_id == PastaAvaliacoes.id)
            .where(
                Avaliacao.status.in_(
                    (StatusAvaliacao.publicada, StatusAvaliacao.encerrada)
                )
            )
        )
        if inst_id:
            av_stmt = av_stmt.where(MateriaCurricular.instituicao_id == inst_id)
        if turma_ids_escopo is not None:
            if turma_ids_escopo:
                av_stmt = av_stmt.where(Avaliacao.turma_id.in_(turma_ids_escopo))
            else:
                av_stmt = av_stmt.where(False)
        for materia, assunto, av in self.db.execute(av_stmt).all():
            materia_data = materias_map.setdefault(
                materia.id,
                {"id": materia.id, "nome": materia.nome, "assuntos": {}},
            )
            assunto_data = materia_data["assuntos"].setdefault(
                assunto.id,
                {
                    "id": assunto.id,
                    "nome": assunto.nome,
                    "avaliacoes": [],
                    "percentuais": [],
                },
            )
            # Para a visão de um único aluno, lista as avaliações ainda não
            # entregues como pendentes (sem nota).
            if aluno_id and not any(
                item.id == av.id for item in assunto_data["avaliacoes"]
            ):
                assunto_data["avaliacoes"].append(
                    DesempenhoAvaliacaoItem(
                        id=av.id,
                        titulo=av.titulo,
                        percentual=None,
                        nota_decimal=None,
                        situacao="pendente",
                        enviada_em=None,
                        aluno_nome=None,
                    )
                )

        materias_out: list[DesempenhoMateriaItem] = []
        for m_data in sorted(materias_map.values(), key=lambda x: x["nome"]):
            assuntos_out: list[DesempenhoAssuntoItem] = []
            materia_percentuais: list[float] = []
            for a_data in sorted(m_data["assuntos"].values(), key=lambda x: x["nome"]):
                pcts = a_data["percentuais"]
                media_assunto = sum(pcts) / len(pcts) if pcts else None
                if media_assunto is not None:
                    materia_percentuais.append(media_assunto)
                assuntos_out.append(
                    DesempenhoAssuntoItem(
                        id=a_data["id"],
                        nome=a_data["nome"],
                        media_percentual=round(media_assunto, 1) if media_assunto else None,
                        avaliacoes=sorted(
                            a_data["avaliacoes"],
                            key=lambda x: x.titulo,
                        ),
                    )
                )
            media_materia = (
                sum(materia_percentuais) / len(materia_percentuais)
                if materia_percentuais
                else None
            )
            materias_out.append(
                DesempenhoMateriaItem(
                    id=m_data["id"],
                    nome=m_data["nome"],
                    media_percentual=round(media_materia, 1) if media_materia else None,
                    assuntos=assuntos_out,
                )
            )

        return DashboardDesempenhoAvaliacoesResponse(materias=materias_out)
