from __future__ import annotations

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
from app.schemas.dashboard import DashboardResumo, DashboardSeriesResponse, NotificacaoItem, SearchHit
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["Dashboard"])


def _svc(db: DbSession) -> DashboardService:
    return DashboardService(db)


@router.get("/dashboard/resumo", response_model=DashboardResumo)
def dashboard_resumo(
    user: Annotated[
        CurrentUser,
        Depends(
            require_perfis(
                TipoPerfil.professor,
                TipoPerfil.administrador,
                TipoPerfil.responsavel,
            )
        ),
    ],
    db: DbSession,
    escopo: str | None = None,
    turma_id: uuid.UUID | None = None,
    aluno_id: uuid.UUID | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> DashboardResumo:
    return _svc(db).resumo(user, escopo, turma_id, aluno_id, data_inicio, data_fim)


@router.get("/dashboard/series", response_model=DashboardSeriesResponse)
def dashboard_series(
    user: Annotated[
        CurrentUser,
        Depends(
            require_perfis(
                TipoPerfil.professor,
                TipoPerfil.administrador,
                TipoPerfil.responsavel,
            )
        ),
    ],
    db: DbSession,
    turma_id: uuid.UUID | None = None,
    aluno_id: uuid.UUID | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> DashboardSeriesResponse:
    return _svc(db).series(user, turma_id, aluno_id, data_inicio, data_fim)


@router.get("/search", response_model=list[SearchHit])
def search(
    user: AuthUser,
    db: DbSession,
    q: str,
    types: str | None = None,
) -> list[SearchHit]:
    return _svc(db).search(user, q, types)


@router.get("/notificacoes", response_model=list[NotificacaoItem])
def list_notificacoes(user: AuthUser, db: DbSession) -> list[NotificacaoItem]:
    return _svc(db).list_notificacoes(user)


@router.patch("/notificacoes/{notif_id}/lida", status_code=status.HTTP_204_NO_CONTENT)
def marcar_notificacao_lida(notif_id: uuid.UUID, user: AuthUser, db: DbSession) -> Response:
    _svc(db).marcar_notificacao_lida(user, notif_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/notificacoes/marcar-todas-lidas", status_code=status.HTTP_204_NO_CONTENT)
def marcar_todas_lidas(user: AuthUser, db: DbSession) -> Response:
    _svc(db).marcar_todas_lidas(user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
