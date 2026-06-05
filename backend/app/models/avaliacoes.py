import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import CreatedAtMixin, TimestampsMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    PapelChat,
    StatusAvaliacao,
    StatusSubmissao,
    TipoQuestao,
)

if TYPE_CHECKING:
    from app.models.governanca import Aluno, Instituicao, Professor, Turma


class MateriaCurricular(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "materia_curricular"

    instituicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="RESTRICT"),
        nullable=False,
    )
    professor_autor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professor.id", ondelete="RESTRICT"),
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str | None] = mapped_column(Text, nullable=True)
    cor_token_ui: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordem: Mapped[int | None] = mapped_column(Integer, nullable=True)

    instituicao: Mapped["Instituicao"] = relationship(back_populates="materias")
    professor_autor: Mapped["Professor"] = relationship(back_populates="materias_autor")
    assuntos: Mapped[list["Assunto"]] = relationship(back_populates="materia")


class Assunto(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "assunto"

    materia_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("materia_curricular.id", ondelete="CASCADE"),
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(Text, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    materia: Mapped["MateriaCurricular"] = relationship(back_populates="assuntos")
    pastas: Mapped[list["PastaAvaliacoes"]] = relationship(back_populates="assunto")


class PastaAvaliacoes(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "pasta_avaliacoes"

    assunto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assunto.id", ondelete="CASCADE"),
        nullable=False,
    )
    nome: Mapped[str] = mapped_column(Text, nullable=False)
    resumo_status_texto: Mapped[str | None] = mapped_column(Text, nullable=True)

    assunto: Mapped["Assunto"] = relationship(back_populates="pastas")
    avaliacoes: Mapped[list["Avaliacao"]] = relationship(back_populates="pasta")


class Avaliacao(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "avaliacao"

    pasta_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pasta_avaliacoes.id", ondelete="CASCADE"),
        nullable=False,
    )
    turma_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("turma.id", ondelete="RESTRICT"),
        nullable=False,
    )
    titulo: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[StatusAvaliacao] = mapped_column(
        Enum(StatusAvaliacao, name="status_avaliacao", create_constraint=True),
        nullable=False,
    )
    publicado_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    encerrada_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    prazo_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payload_editor_jsonb: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    instrucoes_jsonb: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    versao: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    pasta: Mapped["PastaAvaliacoes"] = relationship(back_populates="avaliacoes")
    turma: Mapped["Turma"] = relationship()
    questoes: Mapped[list["Questao"]] = relationship(
        back_populates="avaliacao", order_by="Questao.ordem"
    )
    submissoes: Mapped[list["Submissao"]] = relationship(back_populates="avaliacao")
    mensagens_chat: Mapped[list["AvaliacaoChatMensagem"]] = relationship(
        back_populates="avaliacao"
    )


class Questao(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "questao"
    __table_args__ = (UniqueConstraint("avaliacao_id", "ordem", name="uq_questao_avaliacao_ordem"),)

    avaliacao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("avaliacao.id", ondelete="CASCADE"),
        nullable=False,
    )
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo: Mapped[TipoQuestao] = mapped_column(
        Enum(TipoQuestao, name="tipo_questao", create_constraint=True),
        nullable=False,
    )
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    conteudo_jsonb: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    alternativas_jsonb: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    indice_gabarito: Mapped[int | None] = mapped_column(Integer, nullable=True)
    peso: Mapped[Decimal] = mapped_column(Numeric, default=1, nullable=False)

    avaliacao: Mapped["Avaliacao"] = relationship(back_populates="questoes")
    respostas: Mapped[list["RespostaQuestao"]] = relationship(back_populates="questao")


class Submissao(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "submissao"
    __table_args__ = (
        UniqueConstraint("avaliacao_id", "aluno_id", name="uq_submissao_avaliacao_aluno"),
    )

    avaliacao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("avaliacao.id", ondelete="CASCADE"),
        nullable=False,
    )
    aluno_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("aluno.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[StatusSubmissao] = mapped_column(
        Enum(StatusSubmissao, name="status_submissao", create_constraint=True),
        nullable=False,
    )
    iniciada_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    enviada_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    nota_decimal: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)

    avaliacao: Mapped["Avaliacao"] = relationship(back_populates="submissoes")
    aluno: Mapped["Aluno"] = relationship(back_populates="submissoes")
    respostas: Mapped[list["RespostaQuestao"]] = relationship(back_populates="submissao")
    relatorios_ia: Mapped[list["RelatorioIA"]] = relationship(back_populates="submissao")


class RespostaQuestao(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "resposta_questao"
    __table_args__ = (
        UniqueConstraint("submissao_id", "questao_id", name="uq_resposta_submissao_questao"),
    )

    submissao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissao.id", ondelete="CASCADE"),
        nullable=False,
    )
    questao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questao.id", ondelete="CASCADE"),
        nullable=False,
    )
    valor_jsonb: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    correta_flag: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    pontos_obtidos: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)

    submissao: Mapped["Submissao"] = relationship(back_populates="respostas")
    questao: Mapped["Questao"] = relationship(back_populates="respostas")


class RelatorioIA(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "relatorio_ia"
    __table_args__ = (
        UniqueConstraint("submissao_id", "versao", name="uq_relatorio_ia_submissao_versao"),
    )

    submissao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissao.id", ondelete="CASCADE"),
        nullable=False,
    )
    texto_longo: Mapped[str] = mapped_column(Text, nullable=False)
    versao: Mapped[int] = mapped_column(Integer, nullable=False)
    status_job: Mapped[str] = mapped_column(Text, default="ok", nullable=False)
    id_job_auditoria: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    submissao: Mapped["Submissao"] = relationship(back_populates="relatorios_ia")


class AvaliacaoChatMensagem(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "avaliacao_chat_mensagem"

    avaliacao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("avaliacao.id", ondelete="CASCADE"),
        nullable=False,
    )
    professor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professor.id", ondelete="CASCADE"),
        nullable=False,
    )
    papel: Mapped[PapelChat] = mapped_column(
        Enum(PapelChat, name="papel_chat", create_constraint=True),
        nullable=False,
    )
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)

    avaliacao: Mapped["Avaliacao"] = relationship(back_populates="mensagens_chat")
    professor: Mapped["Professor"] = relationship(back_populates="mensagens_chat")
