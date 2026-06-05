"""avaliacao status inativa

Revision ID: 004
Revises: 003
"""

from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE status_avaliacao ADD VALUE IF NOT EXISTS 'inativa'")


def downgrade() -> None:
    pass
