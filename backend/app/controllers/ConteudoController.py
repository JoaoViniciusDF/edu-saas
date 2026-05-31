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

router = APIRouter(prefix="/conteudo", tags=["Conteúdo"])

EscritaUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.professor, TipoPerfil.administrador))]


def _svc(db: DbSession) -> ConteudoService:
    return ConteudoService(db)


@router.get("/consultar-pastas", response_model=list[PastaConteudoResponse])
def consultar_pastas(user: AuthUser, db: DbSession) -> list[PastaConteudoResponse]:
    return _svc(db).list_pastas(user)


@router.post("/criar-pasta", response_model=PastaConteudoResponse, status_code=201)
def criar_pasta(body: PastaConteudoCreate, user: EscritaUser, db: DbSession) -> PastaConteudoResponse:
    return _svc(db).create_pasta(user, body)


@router.put("/editar-pasta/{pasta_id}", response_model=PastaConteudoResponse)
def editar_pasta(
    pasta_id: uuid.UUID, body: PastaConteudoPatch, user: EscritaUser, db: DbSession
) -> PastaConteudoResponse:
    return _svc(db).patch_pasta(user, pasta_id, body)


@router.delete("/apagar-pasta/{pasta_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_pasta(pasta_id: uuid.UUID, user: EscritaUser, db: DbSession) -> Response:
    _svc(db).delete_pasta(user, pasta_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/consultar-materiais/{pasta_id}", response_model=list[MaterialResponse])
def consultar_materiais(pasta_id: uuid.UUID, user: AuthUser, db: DbSession) -> list[MaterialResponse]:
    return _svc(db).list_materiais(user, pasta_id)


@router.post("/criar-material/{pasta_id}", response_model=MaterialResponse, status_code=201)
def criar_material(
    pasta_id: uuid.UUID, body: MaterialCreate, user: EscritaUser, db: DbSession
) -> MaterialResponse:
    return _svc(db).create_material(user, pasta_id, body)


@router.get("/consultar-material/{material_id}", response_model=MaterialResponse)
def consultar_material(
    material_id: uuid.UUID, user: AuthUser, db: DbSession
) -> MaterialResponse:
    return _svc(db).get_material(user, material_id)


@router.put("/editar-material/{material_id}", response_model=MaterialResponse)
def editar_material(
    material_id: uuid.UUID, body: MaterialPatch, user: EscritaUser, db: DbSession
) -> MaterialResponse:
    return _svc(db).patch_material(user, material_id, body)


@router.delete("/apagar-material/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_material(material_id: uuid.UUID, user: EscritaUser, db: DbSession) -> Response:
    _svc(db).delete_material(user, material_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/gerar-url-upload", response_model=PresignResponse)
def gerar_url_upload(body: PresignRequest, user: EscritaUser, db: DbSession) -> PresignResponse:
    return _svc(db).presign(user, body)
