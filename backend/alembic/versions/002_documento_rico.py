"""conteudo_jsonb e instrucoes_jsonb para documentos ricos

Revision ID: 002
Revises: 001
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def _column_names(table: str) -> set[str]:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    # 001 usa create_all com os models atuais — colunas podem já existir.
    questao_cols = _column_names("questao")
    if "conteudo_jsonb" not in questao_cols:
        op.add_column(
            "questao",
            sa.Column("conteudo_jsonb", JSONB, nullable=True),
        )

    avaliacao_cols = _column_names("avaliacao")
    if "instrucoes_jsonb" not in avaliacao_cols:
        op.add_column(
            "avaliacao",
            sa.Column("instrucoes_jsonb", JSONB, nullable=True),
        )

    op.execute(
        """
        UPDATE questao
        SET conteudo_jsonb = jsonb_build_object(
            'schema_version', '1.0',
            'blocks', jsonb_build_array(
                jsonb_build_object('type', 'paragraph', 'content', enunciado)
            )
        )
        WHERE conteudo_jsonb IS NULL AND enunciado IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_column("avaliacao", "instrucoes_jsonb")
    op.drop_column("questao", "conteudo_jsonb")
