import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import CreatedAtMixin, TimestampsMixin, UUIDPrimaryKeyMixin
from app.models.enums import StatusComunicado, TipoDestinatarioComunicado

if TYPE_CHECKING:
    from app.models.governanca import Instituicao, Professor, Turma, UsuarioConta


class Comunicado(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "comunicado"

    instituicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="RESTRICT"),
        nullable=False,
    )
    emissor_professor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professor.id", ondelete="RESTRICT"),
        nullable=False,
    )
    turma_escopo_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("turma.id", ondelete="SET NULL"),
        nullable=True,
    )
    titulo: Mapped[str] = mapped_column(Text, nullable=False)
    corpo: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[StatusComunicado] = mapped_column(
        Enum(StatusComunicado, name="status_comunicado", create_constraint=True),
        nullable=False,
    )
    publicado_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    instituicao: Mapped["Instituicao"] = relationship(back_populates="comunicados")
    emissor_professor: Mapped["Professor"] = relationship(back_populates="comunicados")
    turma_escopo: Mapped["Turma | None"] = relationship(back_populates="comunicados_escopo")
    imagens: Mapped[list["ComunicadoImagem"]] = relationship(back_populates="comunicado")
    destinatarios: Mapped[list["ComunicadoDestinatario"]] = relationship(
        back_populates="comunicado"
    )
    destinatarios_efetivos: Mapped[list["ComunicadoDestinatarioEfetivo"]] = relationship(
        back_populates="comunicado"
    )
    leituras: Mapped[list["ComunicadoLeitura"]] = relationship(back_populates="comunicado")


class ComunicadoImagem(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "comunicado_imagem"

    comunicado_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comunicado.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)

    comunicado: Mapped["Comunicado"] = relationship(back_populates="imagens")


class ComunicadoDestinatario(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "comunicado_destinatario"

    comunicado_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comunicado.id", ondelete="CASCADE"),
        nullable=False,
    )
    tipo: Mapped[TipoDestinatarioComunicado] = mapped_column(
        Enum(TipoDestinatarioComunicado, name="tipo_destinatario_comunicado", create_constraint=True),
        nullable=False,
    )
    entidade_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    comunicado: Mapped["Comunicado"] = relationship(back_populates="destinatarios")


class ComunicadoDestinatarioEfetivo(Base):
    __tablename__ = "comunicado_destinatario_efetivo"
    __table_args__ = (
        UniqueConstraint(
            "comunicado_id",
            "usuario_id",
            name="uq_comunicado_destinatario_efetivo",
        ),
    )

    comunicado_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comunicado.id", ondelete="CASCADE"),
        primary_key=True,
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="CASCADE"),
        primary_key=True,
    )

    comunicado: Mapped["Comunicado"] = relationship(back_populates="destinatarios_efetivos")
    usuario: Mapped["UsuarioConta"] = relationship()


class ComunicadoLeitura(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "comunicado_leitura"
    __table_args__ = (
        UniqueConstraint("comunicado_id", "usuario_id", name="uq_comunicado_leitura"),
    )

    comunicado_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comunicado.id", ondelete="CASCADE"),
        nullable=False,
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="CASCADE"),
        nullable=False,
    )
    lido_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    comunicado: Mapped["Comunicado"] = relationship(back_populates="leituras")
    usuario: Mapped["UsuarioConta"] = relationship(back_populates="comunicados_leitura")


class Notificacao(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "notificacao"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="CASCADE"),
        nullable=False,
    )
    titulo: Mapped[str] = mapped_column(Text, nullable=False)
    corpo_curto: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_evento: Mapped[str] = mapped_column(Text, nullable=False)
    lida_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    link_profundo: Mapped[str | None] = mapped_column(Text, nullable=True)

    usuario: Mapped["UsuarioConta"] = relationship(back_populates="notificacoes")
