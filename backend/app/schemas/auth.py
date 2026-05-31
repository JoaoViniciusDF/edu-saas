from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import TipoPerfil


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=1)


class UserMe(BaseModel):
    usuario_id: UUID
    email: str
    nome_exibicao: str
    perfil: TipoPerfil
    instituicao_id: UUID | None = None
    preferencias: dict[str, Any] | None = None
    professor_id: UUID | None = None
    aluno_id: UUID | None = None
    responsavel_id: UUID | None = None
    impersonador: "ImpersonadorInfo | None" = None

    model_config = {"from_attributes": True}


class ImpersonadorInfo(BaseModel):
    usuario_id: UUID
    email: str
    nome_exibicao: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expira_em: str
    usuario: UserMe


class RefreshRequest(BaseModel):
    refresh_token: str
    impersonator_id: UUID | None = None


class UserPreferencesPatch(BaseModel):
    tema: str | None = None
    idioma: str | None = None
    densidade_ui: str | None = None
