from __future__ import annotations

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
from app.schemas.dashboard import (
    DashboardDesempenhoAvaliacoesResponse,
    DashboardResumo,
    DashboardSeriesResponse,
    NotificacaoItem,
    SearchHit,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DashboardUser = Annotated[
    CurrentUser,
    Depends(
        require_perfis(
            TipoPerfil.super_admin,
            TipoPerfil.professor,
            TipoPerfil.administrador,
            TipoPerfil.responsavel,
        )
    ),
]


def _svc(db: DbSession) -> DashboardService:
    return DashboardService(db)


@router.get("/consultar-resumo", response_model=DashboardResumo)
def consultar_resumo(
    user: DashboardUser,
    db: DbSession,
    escopo: str | None = None,
    turma_id: uuid.UUID | None = None,
    aluno_id: uuid.UUID | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> DashboardResumo:
    return _svc(db).resumo(user, escopo, turma_id, aluno_id, data_inicio, data_fim)


@router.get(
    "/consultar-desempenho-avaliacoes",
    response_model=DashboardDesempenhoAvaliacoesResponse,
)
def consultar_desempenho_avaliacoes(
    user: DashboardUser,
    db: DbSession,
    escopo: str | None = None,
    turma_id: uuid.UUID | None = None,
    aluno_id: uuid.UUID | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> DashboardDesempenhoAvaliacoesResponse:
    return _svc(db).desempenho_avaliacoes(
        user, escopo, turma_id, aluno_id, data_inicio, data_fim
    )


@router.get("/consultar-series", response_model=DashboardSeriesResponse)
def consultar_series(
    user: DashboardUser,
    db: DbSession,
    escopo: str | None = None,
    turma_id: uuid.UUID | None = None,
    aluno_id: uuid.UUID | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> DashboardSeriesResponse:
    return _svc(db).series(user, escopo, turma_id, aluno_id, data_inicio, data_fim)


@router.get("/buscar", response_model=list[SearchHit])
def buscar(
    user: AuthUser,
    db: DbSession,
    q: str,
    types: str | None = None,
) -> list[SearchHit]:
    return _svc(db).search(user, q, types)


@router.get("/consultar-notificacoes", response_model=list[NotificacaoItem])
def consultar_notificacoes(user: AuthUser, db: DbSession) -> list[NotificacaoItem]:
    return _svc(db).list_notificacoes(user)


@router.put("/marcar-notificacao-lida/{notif_id}", status_code=status.HTTP_204_NO_CONTENT)
def marcar_notificacao_lida(notif_id: uuid.UUID, user: AuthUser, db: DbSession) -> Response:
    _svc(db).marcar_notificacao_lida(user, notif_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/marcar-todas-notificacoes-lidas", status_code=status.HTTP_204_NO_CONTENT)
def marcar_todas_notificacoes_lidas(user: AuthUser, db: DbSession) -> Response:
    _svc(db).marcar_todas_lidas(user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
