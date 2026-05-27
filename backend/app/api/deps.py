from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import forbidden, unauthorized
from app.core.security import decode_token
from app.models.enums import TipoPerfil
from app.models.governanca import Aluno, Professor, Responsavel, UsuarioConta

security_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    usuario: UsuarioConta
    professor_id: uuid.UUID | None = None
    aluno_id: uuid.UUID | None = None
    responsavel_id: uuid.UUID | None = None

    @property
    def id(self) -> uuid.UUID:
        return self.usuario.id

    @property
    def perfil(self) -> TipoPerfil:
        return self.usuario.tipo_perfil

    @property
    def instituicao_id(self) -> uuid.UUID | None:
        return self.usuario.instituicao_id


def _load_profile_ids(db: Session, usuario: UsuarioConta) -> tuple[
    uuid.UUID | None, uuid.UUID | None, uuid.UUID | None
]:
    prof_id = aluno_id = resp_id = None
    if usuario.tipo_perfil == TipoPerfil.professor:
        p = db.scalar(select(Professor).where(Professor.usuario_id == usuario.id))
        prof_id = p.id if p else None
    elif usuario.tipo_perfil == TipoPerfil.aluno:
        a = db.scalar(select(Aluno).where(Aluno.usuario_id == usuario.id))
        aluno_id = a.id if a else None
    elif usuario.tipo_perfil == TipoPerfil.responsavel:
        r = db.scalar(select(Responsavel).where(Responsavel.usuario_id == usuario.id))
        resp_id = r.id if r else None
    elif usuario.tipo_perfil in (TipoPerfil.administrador, TipoPerfil.professor):
        p = db.scalar(select(Professor).where(Professor.usuario_id == usuario.id))
        if p:
            prof_id = p.id
    return prof_id, aluno_id, resp_id


def get_current_user_optional(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> CurrentUser | None:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        return None
    if payload.get("type") != "access":
        return None
    usuario_id = uuid.UUID(payload["sub"])
    usuario = db.get(UsuarioConta, usuario_id)
    if not usuario:
        return None
    prof_id, aluno_id, resp_id = _load_profile_ids(db, usuario)
    return CurrentUser(
        usuario=usuario,
        professor_id=prof_id,
        aluno_id=aluno_id,
        responsavel_id=resp_id,
    )


def get_current_user(
    user: Annotated[CurrentUser | None, Depends(get_current_user_optional)],
) -> CurrentUser:
    if not user:
        raise unauthorized()
    return user


def require_perfis(*perfis: TipoPerfil):
    def _checker(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.perfil not in perfis and user.perfil != TipoPerfil.super_admin:
            if TipoPerfil.super_admin in perfis and user.perfil == TipoPerfil.super_admin:
                return user
            raise forbidden("Perfil não autorizado para esta operação")
        return user

    return _checker


def scoped_instituicao_id(
    user: CurrentUser,
    instituicao_id_param: uuid.UUID | None = None,
) -> uuid.UUID | None:
    if user.perfil == TipoPerfil.super_admin:
        return instituicao_id_param
    return user.instituicao_id


DbSession = Annotated[Session, Depends(get_db)]
AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
