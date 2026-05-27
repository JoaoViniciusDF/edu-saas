from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
from app.schemas.comunicados import ComunicadoCreate, ComunicadoDetail, ComunicadoListItem, ComunicadoPatch
from app.services.comunicados_service import ComunicadosService

router = APIRouter(tags=["Comunicados"])

EscritaUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.professor, TipoPerfil.administrador))]


def _svc(db: DbSession) -> ComunicadosService:
    return ComunicadosService(db)


@router.get("/comunicados", response_model=list[ComunicadoListItem])
def list_comunicados(user: AuthUser, db: DbSession) -> list[ComunicadoListItem]:
    return _svc(db).list_comunicados(user)


@router.get("/comunicados/{comunicado_id}", response_model=ComunicadoDetail)
def get_comunicado(comunicado_id: uuid.UUID, user: AuthUser, db: DbSession) -> ComunicadoDetail:
    return _svc(db).get_comunicado(user, comunicado_id)


@router.post("/comunicados/{comunicado_id}/marcar-lido", status_code=status.HTTP_204_NO_CONTENT)
def marcar_lido(comunicado_id: uuid.UUID, user: AuthUser, db: DbSession) -> Response:
    _svc(db).marcar_lido(user, comunicado_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/comunicados", response_model=ComunicadoDetail, status_code=201)
def create_comunicado(body: ComunicadoCreate, user: EscritaUser, db: DbSession) -> ComunicadoDetail:
    return _svc(db).create_comunicado(user, body)


@router.patch("/comunicados/{comunicado_id}", response_model=ComunicadoDetail)
def patch_comunicado(
    comunicado_id: uuid.UUID, body: ComunicadoPatch, user: EscritaUser, db: DbSession
) -> ComunicadoDetail:
    return _svc(db).patch_comunicado(user, comunicado_id, body)


@router.post("/comunicados/{comunicado_id}/publicar", response_model=ComunicadoDetail)
def publicar_comunicado(
    comunicado_id: uuid.UUID, user: EscritaUser, db: DbSession
) -> ComunicadoDetail:
    return _svc(db).publicar(user, comunicado_id)
