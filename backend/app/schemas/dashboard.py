from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SearchHit(BaseModel):
    id: UUID
    tipo: str
    titulo: str
    subtitulo: str | None = None
    url_deep_link: str | None = None


class NotificacaoItem(BaseModel):
    id: UUID
    titulo: str
    corpo_curto: str
    tipo_evento: str
    lida_flag: bool
    link_profundo: str | None = None
    criado_em: str | None = None


class DashboardResumo(BaseModel):
    media_geral: Decimal | None = None
    taxa_aprovacao: Decimal | None = None
    pendentes_correcao: int = 0
    total_alunos_escopo: int = 0
    insights: list[str] = []


class DashboardQuery(BaseModel):
    escopo: str | None = None
    turma_id: UUID | None = None
    aluno_id: UUID | None = None
    data_inicio: date | None = None
    data_fim: date | None = None


class DashboardSerieItem(BaseModel):
    periodo: date
    turma_id: UUID | None = None
    turma_nome: str | None = None
    aluno_id: UUID | None = None
    aluno_nome: str | None = None
    disciplina: str | None = None
    media: Decimal | None = None
    taxa_aprovacao: Decimal | None = None
    pendentes_correcao: int | None = None


class DashboardSeriesResponse(BaseModel):
    items: list[DashboardSerieItem] = Field(default_factory=list)


class DesempenhoAvaliacaoItem(BaseModel):
    id: UUID
    titulo: str
    percentual: float | None = None
    nota_decimal: Decimal | None = None
    situacao: str
    enviada_em: datetime | None = None
    aluno_nome: str | None = None


class DesempenhoAssuntoItem(BaseModel):
    id: UUID
    nome: str
    media_percentual: float | None = None
    avaliacoes: list[DesempenhoAvaliacaoItem] = Field(default_factory=list)


class DesempenhoMateriaItem(BaseModel):
    id: UUID
    nome: str
    media_percentual: float | None = None
    assuntos: list[DesempenhoAssuntoItem] = Field(default_factory=list)


class DashboardDesempenhoAvaliacoesResponse(BaseModel):
    materias: list[DesempenhoMateriaItem] = Field(default_factory=list)
