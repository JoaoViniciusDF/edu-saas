from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import TipoAnexoMaterial


class PastaConteudoResponse(BaseModel):
    id: UUID
    nome_disciplina: str
    turma_id: UUID | None = None
    cor_token_ui: str | None = None
    icone: str | None = None
    ordem: int | None = None
    quantidade_materiais: int = 0


class PastaConteudoCreate(BaseModel):
    nome_disciplina: str = Field(min_length=1)
    turma_id: UUID | None = None
    cor_token_ui: str | None = None
    icone: str | None = None
    ordem: int | None = None


class PastaConteudoPatch(BaseModel):
    nome_disciplina: str | None = None
    turma_id: UUID | None = None
    cor_token_ui: str | None = None
    icone: str | None = None
    ordem: int | None = None


class MaterialResponse(BaseModel):
    id: UUID
    titulo: str
    descricao: str | None = None
    tipo_anexo: TipoAnexoMaterial
    corpo_texto: str | None = None
    url_objeto: str | None = None
    ordem_exibicao: int | None = None


class MaterialCreate(BaseModel):
    titulo: str = Field(min_length=1)
    descricao: str | None = None
    tipo_anexo: TipoAnexoMaterial
    corpo_texto: str | None = None
    url_objeto: str | None = None
    blob_id: UUID | None = None
    ordem_exibicao: int | None = None


class MaterialPatch(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    tipo_anexo: TipoAnexoMaterial | None = None
    corpo_texto: str | None = None
    url_objeto: str | None = None
    ordem_exibicao: int | None = None


class PresignRequest(BaseModel):
    nome_original: str = Field(min_length=1)
    mime_type: str = Field(min_length=1)
    tamanho_bytes: int = Field(gt=0)
    contexto: str = Field(min_length=1)


class PresignResponse(BaseModel):
    upload_id: UUID
    upload_url: str
    storage_key: str
