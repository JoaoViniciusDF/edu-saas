from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
from app.schemas.conteudo import (
    MaterialCreate,
    MaterialPatch,
    MaterialResponse,
    PastaConteudoCreate,
    PastaConteudoPatch,
    PastaConteudoResponse,
    PresignRequest,
    PresignResponse,
)
from app.services.conteudo_service import ConteudoService

router = APIRouter(tags=["Conteúdo"])

EscritaUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.professor, TipoPerfil.administrador))]


def _svc(db: DbSession) -> ConteudoService:
    return ConteudoService(db)


@router.get("/conteudo/pastas", response_model=list[PastaConteudoResponse])
def list_pastas(user: AuthUser, db: DbSession) -> list[PastaConteudoResponse]:
    return _svc(db).list_pastas(user)


@router.post("/conteudo/pastas", response_model=PastaConteudoResponse, status_code=201)
def create_pasta(body: PastaConteudoCreate, user: EscritaUser, db: DbSession) -> PastaConteudoResponse:
    return _svc(db).create_pasta(user, body)


@router.patch("/conteudo/pastas/{pasta_id}", response_model=PastaConteudoResponse)
def patch_pasta(
    pasta_id: uuid.UUID, body: PastaConteudoPatch, user: EscritaUser, db: DbSession
) -> PastaConteudoResponse:
    return _svc(db).patch_pasta(user, pasta_id, body)


@router.delete("/conteudo/pastas/{pasta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pasta(pasta_id: uuid.UUID, user: EscritaUser, db: DbSession) -> Response:
    _svc(db).delete_pasta(user, pasta_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/conteudo/pastas/{pasta_id}/materiais", response_model=list[MaterialResponse])
def list_materiais(pasta_id: uuid.UUID, user: AuthUser, db: DbSession) -> list[MaterialResponse]:
    return _svc(db).list_materiais(user, pasta_id)


@router.post("/conteudo/pastas/{pasta_id}/materiais", response_model=MaterialResponse, status_code=201)
def create_material(
    pasta_id: uuid.UUID, body: MaterialCreate, user: EscritaUser, db: DbSession
) -> MaterialResponse:
    return _svc(db).create_material(user, pasta_id, body)


@router.get("/conteudo/materiais/{material_id}", response_model=MaterialResponse)
def get_material(material_id: uuid.UUID, user: AuthUser, db: DbSession) -> MaterialResponse:
    return _svc(db).get_material(user, material_id)


@router.patch("/conteudo/materiais/{material_id}", response_model=MaterialResponse)
def patch_material(
    material_id: uuid.UUID, body: MaterialPatch, user: EscritaUser, db: DbSession
) -> MaterialResponse:
    return _svc(db).patch_material(user, material_id, body)


@router.delete("/conteudo/materiais/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(material_id: uuid.UUID, user: EscritaUser, db: DbSession) -> Response:
    _svc(db).delete_material(user, material_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/uploads/presign", response_model=PresignResponse)
def presign_upload(body: PresignRequest, user: EscritaUser, db: DbSession) -> PresignResponse:
    return _svc(db).presign(user, body)
