"""initial schema — 27 tabelas EduSaaS

Revision ID: 001
Revises:
Create Date: 2026-05-20

"""

from typing import Sequence, Union

from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    import app.models  # noqa: F401
    from app.core.database import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)

    op.execute(
        """
        ALTER TABLE usuario_conta ADD CONSTRAINT ck_usuario_conta_instituicao_perfil
        CHECK (
            (tipo_perfil::text = 'super_admin' AND instituicao_id IS NULL)
            OR (tipo_perfil::text <> 'super_admin' AND instituicao_id IS NOT NULL)
        )
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX uq_usuario_conta_email_instituicao
        ON usuario_conta (instituicao_id, lower(email::text))
        WHERE instituicao_id IS NOT NULL
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_usuario_conta_email_super_admin
        ON usuario_conta (lower(email::text))
        WHERE instituicao_id IS NULL
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX uq_matricula_aluno_ativa
        ON matricula (aluno_id)
        WHERE situacao = 'ativa'
        """
    )

    op.execute(
        "CREATE INDEX ix_avaliacao_pasta_status ON avaliacao (pasta_id, status)"
    )
    op.execute(
        """
        CREATE INDEX ix_notificacao_usuario_lida_criado
        ON notificacao (usuario_id, lida_flag, criado_em DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX ix_material_estudo_pasta_criado
        ON material_estudo (pasta_conteudo_id, criado_em DESC)
        """
    )

    op.execute(
        """
        CREATE INDEX ix_comunicado_fts ON comunicado
        USING gin (to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(corpo, '')))
        """
    )
    op.execute(
        """
        CREATE INDEX ix_material_estudo_fts ON material_estudo
        USING gin (to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '')))
        """
    )
    op.execute(
        """
        CREATE INDEX ix_avaliacao_titulo_fts ON avaliacao
        USING gin (to_tsvector('portuguese', coalesce(titulo, '')))
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_avaliacao_titulo_fts")
    op.execute("DROP INDEX IF EXISTS ix_material_estudo_fts")
    op.execute("DROP INDEX IF EXISTS ix_comunicado_fts")
    op.execute("DROP INDEX IF EXISTS ix_material_estudo_pasta_criado")
    op.execute("DROP INDEX IF EXISTS ix_notificacao_usuario_lida_criado")
    op.execute("DROP INDEX IF EXISTS ix_avaliacao_pasta_status")
    op.execute("DROP INDEX IF EXISTS uq_matricula_aluno_ativa")
    op.execute("DROP INDEX IF EXISTS uq_usuario_conta_email_super_admin")
    op.execute("DROP INDEX IF EXISTS uq_usuario_conta_email_instituicao")
    op.execute(
        "ALTER TABLE usuario_conta DROP CONSTRAINT IF EXISTS ck_usuario_conta_instituicao_perfil"
    )

    import app.models  # noqa: F401
    from app.core.database import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)

    op.execute("DROP EXTENSION IF EXISTS citext")
