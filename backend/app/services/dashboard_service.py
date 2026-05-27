from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.exceptions import bad_request, forbidden
from app.models.analytics import DashboardFatoDesempenho
from app.models.avaliacoes import Avaliacao, Submissao
from app.models.comunicados import Comunicado, Notificacao
from app.models.conteudo import MaterialEstudo
from app.models.enums import StatusSubmissao, TipoPerfil
from app.models.governanca import AlunoResponsavel
from app.models.governanca import Aluno, Turma
from app.schemas.dashboard import (
    DashboardResumo,
    DashboardSerieItem,
    DashboardSeriesResponse,
    NotificacaoItem,
    SearchHit,
)


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

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

        stmt = select(DashboardFatoDesempenho)
        if inst_id:
            stmt = stmt.where(DashboardFatoDesempenho.instituicao_id == inst_id)
        if turma_id:
            stmt = stmt.where(DashboardFatoDesempenho.turma_id == turma_id)
        if aluno_id:
            stmt = stmt.where(DashboardFatoDesempenho.aluno_id == aluno_id)
        if data_inicio:
            stmt = stmt.where(DashboardFatoDesempenho.periodo_referencia >= data_inicio)
        if data_fim:
            stmt = stmt.where(DashboardFatoDesempenho.periodo_referencia <= data_fim)

        if user.perfil == TipoPerfil.responsavel and user.responsavel_id:
            aluno_ids = select(AlunoResponsavel.aluno_id).where(
                AlunoResponsavel.responsavel_id == user.responsavel_id
            )
            stmt = stmt.where(DashboardFatoDesempenho.aluno_id.in_(aluno_ids))

        fatos = list(self.db.scalars(stmt).all())
        media = None
        taxa = None
        if fatos:
            medias = [f.media for f in fatos if f.media is not None]
            taxas = [f.taxa_aprovacao for f in fatos if f.taxa_aprovacao is not None]
            if medias:
                media = sum(medias, Decimal("0")) / len(medias)
            if taxas:
                taxa = sum(taxas, Decimal("0")) / len(taxas)

        pendentes = self.db.scalar(
            select(func.count())
            .select_from(Submissao)
            .where(Submissao.status == StatusSubmissao.enviada)
        ) or 0

        insights: list[str] = []
        if pendentes:
            insights.append(f"{pendentes} submissões aguardando correção")
        if media is not None:
            insights.append(f"Média geral no período: {media:.2f}")

        return DashboardResumo(
            media_geral=media,
            taxa_aprovacao=taxa,
            pendentes_correcao=pendentes,
            total_alunos_escopo=len({f.aluno_id for f in fatos if f.aluno_id}),
            insights=insights,
        )

    def series(
        self,
        user: CurrentUser,
        turma_id: uuid.UUID | None = None,
        aluno_id: uuid.UUID | None = None,
        data_inicio: date | None = None,
        data_fim: date | None = None,
    ) -> DashboardSeriesResponse:
        if user.perfil == TipoPerfil.aluno:
            raise forbidden()

        stmt = select(DashboardFatoDesempenho)
        inst_id = user.instituicao_id
        if inst_id:
            stmt = stmt.where(DashboardFatoDesempenho.instituicao_id == inst_id)
        if turma_id:
            stmt = stmt.where(DashboardFatoDesempenho.turma_id == turma_id)
        if aluno_id:
            stmt = stmt.where(DashboardFatoDesempenho.aluno_id == aluno_id)
        if data_inicio:
            stmt = stmt.where(DashboardFatoDesempenho.periodo_referencia >= data_inicio)
        if data_fim:
            stmt = stmt.where(DashboardFatoDesempenho.periodo_referencia <= data_fim)

        if user.perfil == TipoPerfil.responsavel and user.responsavel_id:
            aluno_ids = select(AlunoResponsavel.aluno_id).where(
                AlunoResponsavel.responsavel_id == user.responsavel_id
            )
            stmt = stmt.where(DashboardFatoDesempenho.aluno_id.in_(aluno_ids))

        fatos = list(self.db.scalars(stmt.order_by(DashboardFatoDesempenho.periodo_referencia)).all())
        items: list[DashboardSerieItem] = []
        for f in fatos:
            turma_nome = None
            aluno_nome = None
            if f.turma_id:
                turma = self.db.get(Turma, f.turma_id)
                turma_nome = turma.nome if turma else None
            if f.aluno_id:
                aluno = self.db.get(Aluno, f.aluno_id)
                if aluno and aluno.usuario:
                    aluno_nome = aluno.usuario.nome_exibicao
            items.append(
                DashboardSerieItem(
                    periodo=f.periodo_referencia,
                    turma_id=f.turma_id,
                    turma_nome=turma_nome,
                    aluno_id=f.aluno_id,
                    aluno_nome=aluno_nome,
                    disciplina=str(f.disciplina_id) if f.disciplina_id else "geral",
                    media=f.media,
                    taxa_aprovacao=f.taxa_aprovacao,
                    pendentes_correcao=f.pendentes_correcao,
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
            rows = self.db.scalars(
                select(Avaliacao)
                .join(Avaliacao.pasta)
                .where(Avaliacao.titulo.ilike(pattern))
                .limit(20)
            ).all()
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
