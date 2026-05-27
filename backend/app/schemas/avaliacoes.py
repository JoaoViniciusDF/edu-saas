from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import StatusAvaliacao, StatusSubmissao, TipoQuestao
from app.schemas.documento import Documento


class MateriaResponse(BaseModel):
    id: UUID
    nome: str
    slug: str | None = None
    cor_token_ui: str | None = None
    ordem: int | None = None


class MateriaCreate(BaseModel):
    nome: str = Field(min_length=1)
    slug: str | None = None
    cor_token_ui: str | None = None
    ordem: int | None = None


class MateriaPatch(BaseModel):
    nome: str | None = None
    slug: str | None = None
    cor_token_ui: str | None = None
    ordem: int | None = None


class AssuntoResponse(BaseModel):
    id: UUID
    nome: str
    ordem: int


class AssuntoCreate(BaseModel):
    nome: str = Field(min_length=1)
    ordem: int = 0


class AssuntoPatch(BaseModel):
    nome: str | None = None
    ordem: int | None = None


class PastaResponse(BaseModel):
    id: UUID
    nome: str
    resumo_status_texto: str | None = None
    total_avaliacoes: int | None = None
    total_submissoes: int | None = None


class PastaPatch(BaseModel):
    nome: str | None = None


class PastaCreate(BaseModel):
    nome: str = Field(min_length=1)


class AvaliacaoListItem(BaseModel):
    id: UUID
    titulo: str
    status: StatusAvaliacao
    prazo_utc: datetime | None = None
    publicado_em: datetime | None = None


class AvaliacaoDetail(BaseModel):
    id: UUID
    pasta_id: UUID
    titulo: str
    status: StatusAvaliacao
    prazo_utc: datetime | None = None
    publicado_em: datetime | None = None
    encerrada_em: datetime | None = None
    payload_editor: dict[str, Any] | None = None
    instrucoes_gerais: Documento | dict[str, Any] | None = None
    versao: int
    questoes: list["QuestaoResponse"] = []


class AvaliacaoCreate(BaseModel):
    titulo: str = Field(min_length=1)
    prazo_utc: datetime | None = None


class AvaliacaoPatch(BaseModel):
    titulo: str | None = None
    prazo_utc: datetime | None = None
    payload_editor: dict[str, Any] | None = None
    instrucoes_gerais: Documento | None = None


class QuestaoUpsert(BaseModel):
    id: UUID | None = None
    tipo: TipoQuestao
    ordem: int
    enunciado: str | None = None
    conteudo: Documento | None = None
    alternativas: list[str] | None = None
    resposta_correta: int | None = None
    peso: Decimal = Decimal("1")

    @model_validator(mode="after")
    def exige_texto(self) -> "QuestaoUpsert":
        if not self.conteudo and not (self.enunciado and self.enunciado.strip()):
            raise ValueError("Informe enunciado ou conteudo")
        return self


class QuestaoResponse(BaseModel):
    id: UUID
    ordem: int
    tipo: TipoQuestao
    enunciado: str
    conteudo: dict[str, Any] | None = None
    alternativas: list[str] | None = None
    resposta_correta: int | None = None
    peso: Decimal


class QuestoesBulkReplace(BaseModel):
    questoes: list[QuestaoUpsert]


class QuestaoOrdemItem(BaseModel):
    id: UUID
    ordem: int


class QuestoesReorder(BaseModel):
    ordens: list[QuestaoOrdemItem]


class ArvoreAssunto(BaseModel):
    id: UUID
    nome: str
    ordem: int
    pastas: list["ArvorePasta"]


class ArvorePasta(BaseModel):
    id: UUID
    nome: str
    avaliacoes: list[AvaliacaoListItem]


class ArvoreMateria(BaseModel):
    id: UUID
    nome: str
    assuntos: list[ArvoreAssunto]


class AlunoAvaliacaoDisponivel(BaseModel):
    id: UUID
    titulo: str
    prazo_utc: datetime | None = None
    status_submissao: StatusSubmissao | None = None


class AlunoAvaliacaoView(BaseModel):
    id: UUID
    titulo: str
    prazo_utc: datetime | None = None
    questoes: list["QuestaoAlunoView"]
    submissao_id: UUID | None = None


class QuestaoAlunoView(BaseModel):
    id: UUID
    ordem: int
    tipo: TipoQuestao
    enunciado: str
    conteudo: dict[str, Any] | None = None
    alternativas: list[str] | None = None


class RespostaQuestaoInput(BaseModel):
    questao_id: UUID
    valor_texto: str | None = None
    indice_selecionado: int | None = None


class SubmissaoPatch(BaseModel):
    respostas: list[RespostaQuestaoInput]


class SubmissaoResponse(BaseModel):
    id: UUID
    avaliacao_id: UUID
    status: StatusSubmissao
    nota_decimal: Decimal | None = None
    enviada_em: datetime | None = None


AvaliacaoDetail.model_rebuild()
ArvoreMateria.model_rebuild()
