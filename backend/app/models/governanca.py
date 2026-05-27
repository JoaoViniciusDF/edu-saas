import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import CITEXT, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import CreatedAtMixin, TimestampsMixin, UUIDPrimaryKeyMixin
from app.models.enums import SituacaoMatricula, StatusConta, TipoPerfil

if TYPE_CHECKING:
    from app.models.avaliacoes import AvaliacaoChatMensagem, MateriaCurricular, Submissao
    from app.models.comunicados import Comunicado, ComunicadoLeitura, Notificacao
    from app.models.conteudo import MaterialEstudo, PastaConteudo, UploadBlob


class Instituicao(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "instituicao"

    nome_fantasia: Mapped[str] = mapped_column(Text, nullable=False)
    documento_legal: Mapped[str | None] = mapped_column(Text, nullable=True)
    configuracoes_jsonb: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    usuarios: Mapped[list["UsuarioConta"]] = relationship(back_populates="instituicao")
    turmas: Mapped[list["Turma"]] = relationship(back_populates="instituicao")
    materias: Mapped[list["MateriaCurricular"]] = relationship(back_populates="instituicao")
    pastas_conteudo: Mapped[list["PastaConteudo"]] = relationship(back_populates="instituicao")
    comunicados: Mapped[list["Comunicado"]] = relationship(back_populates="instituicao")
    uploads: Mapped[list["UploadBlob"]] = relationship(back_populates="instituicao")


class UsuarioConta(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "usuario_conta"

    instituicao_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="RESTRICT"),
        nullable=True,
    )
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    senha_hash: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_perfil: Mapped[TipoPerfil] = mapped_column(
        Enum(TipoPerfil, name="tipo_perfil", create_constraint=True),
        nullable=False,
    )
    status_conta: Mapped[StatusConta] = mapped_column(
        Enum(StatusConta, name="status_conta", create_constraint=True),
        nullable=False,
    )
    nome_exibicao: Mapped[str] = mapped_column(Text, nullable=False)
    preferencias_ui: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    instituicao: Mapped["Instituicao | None"] = relationship(back_populates="usuarios")
    professor: Mapped["Professor | None"] = relationship(back_populates="usuario")
    aluno: Mapped["Aluno | None"] = relationship(back_populates="usuario")
    responsavel: Mapped["Responsavel | None"] = relationship(back_populates="usuario")
    comunicados_leitura: Mapped[list["ComunicadoLeitura"]] = relationship(
        back_populates="usuario"
    )
    notificacoes: Mapped[list["Notificacao"]] = relationship(back_populates="usuario")
    uploads_criados: Mapped[list["UploadBlob"]] = relationship(
        back_populates="criado_por_usuario"
    )


class Professor(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "professor"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    registro_funcional: Mapped[str | None] = mapped_column(Text, nullable=True)
    areas_especialidade: Mapped[str | None] = mapped_column(Text, nullable=True)

    usuario: Mapped["UsuarioConta"] = relationship(back_populates="professor")
    turmas_titulares: Mapped[list["Turma"]] = relationship(back_populates="professor_titular")
    materias_autor: Mapped[list["MateriaCurricular"]] = relationship(
        back_populates="professor_autor"
    )
    materiais: Mapped[list["MaterialEstudo"]] = relationship(back_populates="professor_autor")
    comunicados: Mapped[list["Comunicado"]] = relationship(back_populates="emissor_professor")
    mensagens_chat: Mapped[list["AvaliacaoChatMensagem"]] = relationship(
        back_populates="professor"
    )


class Aluno(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "aluno"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    nome_social: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    matricula_codigo: Mapped[str | None] = mapped_column(Text, nullable=True)

    usuario: Mapped["UsuarioConta"] = relationship(back_populates="aluno")
    matriculas: Mapped[list["Matricula"]] = relationship(back_populates="aluno")
    vinculos_responsaveis: Mapped[list["AlunoResponsavel"]] = relationship(
        back_populates="aluno"
    )
    submissoes: Mapped[list["Submissao"]] = relationship(back_populates="aluno")


class Responsavel(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "responsavel"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuario_conta.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    grau_parentesco: Mapped[str | None] = mapped_column(Text, nullable=True)
    telefone: Mapped[str | None] = mapped_column(Text, nullable=True)

    usuario: Mapped["UsuarioConta"] = relationship(back_populates="responsavel")
    vinculos_alunos: Mapped[list["AlunoResponsavel"]] = relationship(
        back_populates="responsavel"
    )


class AlunoResponsavel(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "aluno_responsavel"
    __table_args__ = (
        UniqueConstraint("aluno_id", "responsavel_id", name="uq_aluno_responsavel"),
    )

    aluno_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("aluno.id", ondelete="CASCADE"),
        nullable=False,
    )
    responsavel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("responsavel.id", ondelete="CASCADE"),
        nullable=False,
    )
    responsavel_principal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ordem_contato: Mapped[int | None] = mapped_column(Integer, nullable=True)

    aluno: Mapped["Aluno"] = relationship(back_populates="vinculos_responsaveis")
    responsavel: Mapped["Responsavel"] = relationship(back_populates="vinculos_alunos")


class Turma(UUIDPrimaryKeyMixin, TimestampsMixin, Base):
    __tablename__ = "turma"

    instituicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="RESTRICT"),
        nullable=False,
    )
    professor_titular_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professor.id", ondelete="SET NULL"),
        nullable=True,
    )
    nome: Mapped[str] = mapped_column(Text, nullable=False)
    ano_letivo: Mapped[str] = mapped_column(Text, nullable=False)
    turno: Mapped[str | None] = mapped_column(Text, nullable=True)

    instituicao: Mapped["Instituicao"] = relationship(back_populates="turmas")
    professor_titular: Mapped["Professor | None"] = relationship(
        back_populates="turmas_titulares"
    )
    matriculas: Mapped[list["Matricula"]] = relationship(back_populates="turma")
    pastas_conteudo: Mapped[list["PastaConteudo"]] = relationship(back_populates="turma")
    comunicados_escopo: Mapped[list["Comunicado"]] = relationship(
        back_populates="turma_escopo"
    )


class Matricula(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "matricula"

    aluno_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("aluno.id", ondelete="CASCADE"),
        nullable=False,
    )
    turma_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("turma.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    situacao: Mapped[SituacaoMatricula] = mapped_column(
        Enum(SituacaoMatricula, name="situacao_matricula", create_constraint=True),
        nullable=False,
    )

    aluno: Mapped["Aluno"] = relationship(back_populates="matriculas")
    turma: Mapped["Turma"] = relationship(back_populates="matriculas")
