import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.governanca import Aluno, Instituicao, Turma


class DashboardFatoDesempenho(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "dashboard_fato_desempenho"

    instituicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("instituicao.id", ondelete="CASCADE"),
        nullable=False,
    )
    turma_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("turma.id", ondelete="SET NULL"),
        nullable=True,
    )
    aluno_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("aluno.id", ondelete="SET NULL"),
        nullable=True,
    )
    disciplina_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    periodo_referencia: Mapped[date] = mapped_column(Date, nullable=False)
    media: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    taxa_aprovacao: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    pendentes_correcao: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fonte: Mapped[str] = mapped_column(Text, nullable=False)

    instituicao: Mapped["Instituicao"] = relationship()
    turma: Mapped["Turma | None"] = relationship()
    aluno: Mapped["Aluno | None"] = relationship()
