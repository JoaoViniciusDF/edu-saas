"""comunicado destinatario tipo professor

Revision ID: 003
Revises: 002
"""

from typing import Sequence, Union

from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE tipo_destinatario_comunicado ADD VALUE IF NOT EXISTS 'professor'"
    )


def downgrade() -> None:
    pass
