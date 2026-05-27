from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import StatusComunicado, TipoDestinatarioComunicado


class DestinatarioRef(BaseModel):
    tipo: TipoDestinatarioComunicado
    id: UUID


class ComunicadoListItem(BaseModel):
    id: UUID
    titulo: str
    status: StatusComunicado
    publicado_em: datetime | None = None
    lido: bool = False
    preview_corpo: str | None = None


class ComunicadoDetail(BaseModel):
    id: UUID
    titulo: str
    corpo: str
    status: StatusComunicado
    publicado_em: datetime | None = None
    imagens_urls: list[str] = []
    destinatarios: list[DestinatarioRef] = []
    lido: bool = False


class ComunicadoCreate(BaseModel):
    titulo: str = Field(min_length=1)
    corpo: str = ""
    imagens_urls: list[str] = []
    destinatarios: list[DestinatarioRef] = []
    status_inicial: StatusComunicado = StatusComunicado.rascunho


class ComunicadoPatch(BaseModel):
    titulo: str | None = None
    corpo: str | None = None
    imagens_urls: list[str] | None = None
    destinatarios: list[DestinatarioRef] | None = None
