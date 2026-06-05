from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
from app.schemas.comunicados import (
    ComunicadoCreate,
    ComunicadoDetail,
    ComunicadoLeiturasResponse,
    ComunicadoListItem,
    ComunicadoPatch,
)
from app.services.comunicados_service import ComunicadosService

router = APIRouter(prefix="/comunicados", tags=["Comunicados"])

EscritaUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.professor, TipoPerfil.administrador))]


def _svc(db: DbSession) -> ComunicadosService:
    return ComunicadosService(db)


@router.get("/consultar-comunicados", response_model=list[ComunicadoListItem])
def consultar_comunicados(user: AuthUser, db: DbSession) -> list[ComunicadoListItem]:
    return _svc(db).list_comunicados(user)


@router.get("/consultar-comunicado/{comunicado_id}", response_model=ComunicadoDetail)
def consultar_comunicado(
    comunicado_id: uuid.UUID, user: AuthUser, db: DbSession
) -> ComunicadoDetail:
    return _svc(db).get_comunicado(user, comunicado_id)


@router.post("/marcar-comunicado-lido/{comunicado_id}", status_code=status.HTTP_204_NO_CONTENT)
def marcar_comunicado_lido(
    comunicado_id: uuid.UUID, user: AuthUser, db: DbSession
) -> Response:
    _svc(db).marcar_lido(user, comunicado_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/marcar-todos-comunicados-lidos", status_code=status.HTTP_204_NO_CONTENT)
def marcar_todos_comunicados_lidos(user: AuthUser, db: DbSession) -> Response:
    _svc(db).marcar_todos_lidos(user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/consultar-leituras-comunicado/{comunicado_id}",
    response_model=ComunicadoLeiturasResponse,
)
def consultar_leituras_comunicado(
    comunicado_id: uuid.UUID,
    user: EscritaUser,
    db: DbSession,
) -> ComunicadoLeiturasResponse:
    return _svc(db).consultar_leituras(user, comunicado_id)


@router.post("/criar-comunicado", response_model=ComunicadoDetail, status_code=201)
def criar_comunicado(body: ComunicadoCreate, user: EscritaUser, db: DbSession) -> ComunicadoDetail:
    return _svc(db).create_comunicado(user, body)


@router.put("/editar-comunicado/{comunicado_id}", response_model=ComunicadoDetail)
def editar_comunicado(
    comunicado_id: uuid.UUID, body: ComunicadoPatch, user: EscritaUser, db: DbSession
) -> ComunicadoDetail:
    return _svc(db).patch_comunicado(user, comunicado_id, body)


@router.post("/publicar-comunicado/{comunicado_id}", response_model=ComunicadoDetail)
def publicar_comunicado(
    comunicado_id: uuid.UUID, user: EscritaUser, db: DbSession
) -> ComunicadoDetail:
    return _svc(db).publicar(user, comunicado_id)
