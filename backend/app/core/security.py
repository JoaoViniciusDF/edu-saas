from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import get_settings
from app.models.enums import TipoPerfil

_ph = PasswordHasher()


def hash_password(senha: str) -> str:
    return _ph.hash(senha)


def verify_password(senha: str, senha_hash: str) -> bool:
    try:
        _ph.verify(senha_hash, senha)
        return True
    except VerifyMismatchError:
        return False


def _encode(payload: dict[str, Any], expires_delta: timedelta) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    data = {
        **payload,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(data, settings.jwt_secret, algorithm="HS256")


def create_access_token(
    usuario_id: uuid.UUID,
    perfil: TipoPerfil,
    instituicao_id: uuid.UUID | None,
    *,
    impersonator_id: uuid.UUID | None = None,
) -> str:
    settings = get_settings()
    payload: dict[str, Any] = {
        "sub": str(usuario_id),
        "type": "access",
        "perfil": perfil.value,
        "instituicao_id": str(instituicao_id) if instituicao_id else None,
    }
    if impersonator_id is not None:
        payload["impersonator_id"] = str(impersonator_id)
    return _encode(payload, timedelta(minutes=settings.jwt_access_minutes))


def create_refresh_token(usuario_id: uuid.UUID) -> str:
    settings = get_settings()
    return _encode(
        {"sub": str(usuario_id), "type": "refresh"},
        timedelta(days=settings.jwt_refresh_days),
    )


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
