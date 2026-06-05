from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
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
    turma_id: UUID | None = None
    turma_nome: str | None = None
    prazo_utc: datetime | None = None
    publicado_em: datetime | None = None
    total_submissoes: int | None = None
    total_alunos_turma: int | None = None


class AvaliacaoDetail(BaseModel):
    id: UUID
    pasta_id: UUID
    titulo: str
    status: StatusAvaliacao
    turma_id: UUID | None = None
    turma_nome: str | None = None
    prazo_utc: datetime | None = None
    publicado_em: datetime | None = None
    encerrada_em: datetime | None = None
    payload_editor: dict[str, Any] | None = None
    instrucoes_gerais: Documento | dict[str, Any] | None = None
    versao: int
    questoes: list["QuestaoResponse"] = []


class AvaliacaoPublicar(BaseModel):
    turma_id: UUID


class AvaliacaoCreate(BaseModel):
    titulo: str = Field(min_length=1)
    prazo_utc: datetime | None = None
    turma_id: UUID | None = None


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


SituacaoAvaliacaoAluno = Literal["pendente", "em_andamento", "concluida"]


class AlunoAvaliacaoDisponivel(BaseModel):
    id: UUID
    titulo: str
    turma_id: UUID
    turma_nome: str
    prazo_utc: datetime | None = None
    status_avaliacao: StatusAvaliacao
    status_submissao: StatusSubmissao | None = None
    situacao: SituacaoAvaliacaoAluno
    nota_decimal: Decimal | None = None
    percentual_acerto: float | None = None


class AlunoAvaliacaoView(BaseModel):
    id: UUID
    titulo: str
    prazo_utc: datetime | None = None
    questoes: list["QuestaoAlunoView"]
    submissao_id: UUID | None = None
    status_submissao: StatusSubmissao | None = None
    situacao: SituacaoAvaliacaoAluno | None = None
    somente_leitura: bool = False
    exibir_gabarito: bool = False
    nota_decimal: Decimal | None = None
    percentual_acerto: float | None = None
    total_questoes: int = 0
    questoes_corretas: int = 0
    respostas: list["RespostaQuestaoInput"] = []


class AvaliacaoDuplicar(BaseModel):
    pasta_id: UUID | None = None
    titulo: str | None = None


class AvaliacaoReabrir(BaseModel):
    prazo_utc: datetime | None = None


class SubmissaoResumoProfessor(BaseModel):
    submissao_id: UUID | None = None
    aluno_id: UUID
    aluno_nome: str
    situacao: SituacaoAvaliacaoAluno
    status_submissao: StatusSubmissao | None = None
    nota_decimal: Decimal | None = None
    percentual_acerto: float | None = None
    enviada_em: datetime | None = None


class SubmissoesAvaliacaoProfessor(BaseModel):
    total_alunos: int
    total_concluidas: int
    total_pendentes: int
    alunos: list[SubmissaoResumoProfessor]


class QuestaoAlunoView(BaseModel):
    id: UUID
    ordem: int
    tipo: TipoQuestao
    enunciado: str
    conteudo: dict[str, Any] | None = None
    alternativas: list[str] | None = None
    indice_resposta_aluno: int | None = None
    indice_gabarito: int | None = None
    acertou: bool | None = None


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
    percentual_acerto: float | None = None
    enviada_em: datetime | None = None


AvaliacaoDetail.model_rebuild()
ArvoreMateria.model_rebuild()
