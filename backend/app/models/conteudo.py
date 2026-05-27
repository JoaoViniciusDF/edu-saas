import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import CreatedAtMixin, TimestampsMixin, UUIDPrimaryKeyMixin
from app.models.enums import TipoAnexoMaterial

if TYPE_CHECKING:
    from app.models.governanca import Instituicao, Professor, Turma, UsuarioConta


class PastaConteudo(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "pasta_conteudo"

    instituicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="RESTRICT"),
        nullable=False,
    )
    turma_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("turma.id", ondelete="SET NULL"),
        nullable=True,
    )
    nome_disciplina: Mapped[str] = mapped_column(Text, nullable=False)
    cor_token_ui: Mapped[str | None] = mapped_column(Text, nullable=True)
    icone: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordem: Mapped[int | None] = mapped_column(Integer, nullable=True)

    instituicao: Mapped["Instituicao"] = relationship(back_populates="pastas_conteudo")
    turma: Mapped["Turma | None"] = relationship(back_populates="pastas_conteudo")
    materiais: Mapped[list["MaterialEstudo"]] = relationship(back_populates="pasta_conteudo")


class MaterialEstudo(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "material_estudo"

    pasta_conteudo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pasta_conteudo.id", ondelete="CASCADE"),
        nullable=False,
    )
    professor_autor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professor.id", ondelete="RESTRICT"),
        nullable=False,
    )
    titulo: Mapped[str] = mapped_column(Text, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo_anexo: Mapped[TipoAnexoMaterial] = mapped_column(
        Enum(TipoAnexoMaterial, name="tipo_anexo_material", create_constraint=True),
        nullable=False,
    )
    corpo_texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    url_objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    blob_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("upload_blob.id", ondelete="SET NULL"),
        nullable=True,
    )
    metadados_duracao_texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordem_exibicao: Mapped[int | None] = mapped_column(Integer, nullable=True)

    pasta_conteudo: Mapped["PastaConteudo"] = relationship(back_populates="materiais")
    professor_autor: Mapped["Professor"] = relationship(back_populates="materiais")
    blob: Mapped["UploadBlob | None"] = relationship(back_populates="materiais")


class UploadBlob(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "upload_blob"

    instituicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="RESTRICT"),
        nullable=False,
    )
    criado_por_usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="RESTRICT"),
        nullable=False,
    )
    nome_original: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    tamanho_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    contexto: Mapped[str] = mapped_column(Text, nullable=False)

    instituicao: Mapped["Instituicao"] = relationship(back_populates="uploads")
    criado_por_usuario: Mapped["UsuarioConta"] = relationship(back_populates="uploads_criados")
    materiais: Mapped[list["MaterialEstudo"]] = relationship(back_populates="blob")
