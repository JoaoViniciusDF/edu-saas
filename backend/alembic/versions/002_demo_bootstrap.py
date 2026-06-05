"""bootstrap demo — instituição, usuários @edu.com.br e conteúdo didático

Revision ID: 002
Revises: 001
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INSTITUICAO_NOME = "Escola Demo Edu"


def upgrade() -> None:
    from scripts.demo_bootstrap import run_demo_bootstrap

    run_demo_bootstrap(bind=op.get_bind())


def downgrade() -> None:
    bind = op.get_bind()
    inst_id = bind.execute(
        sa.text("SELECT id FROM instituicao WHERE nome_fantasia = :nome"),
        {"nome": INSTITUICAO_NOME},
    ).scalar()
    if inst_id is None:
        bind.execute(
            sa.text(
                "DELETE FROM usuario_conta WHERE email = :email AND instituicao_id IS NULL"
            ),
            {"email": "admin@edu.com.br"},
        )
        return

    inst_param = {"inst_id": inst_id}
    bind.execute(
        sa.text("DELETE FROM dashboard_fato_desempenho WHERE instituicao_id = :inst_id"),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM comunicado_destinatario
            WHERE comunicado_id IN (SELECT id FROM comunicado WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text("DELETE FROM comunicado WHERE instituicao_id = :inst_id"),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM material_estudo
            WHERE pasta_conteudo_id IN (SELECT id FROM pasta_conteudo WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text("DELETE FROM pasta_conteudo WHERE instituicao_id = :inst_id"),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM questao
            WHERE avaliacao_id IN (
                SELECT a.id FROM avaliacao a
                JOIN pasta_avaliacoes p ON a.pasta_id = p.id
                JOIN assunto s ON p.assunto_id = s.id
                JOIN materia_curricular m ON s.materia_id = m.id
                WHERE m.instituicao_id = :inst_id
            )
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM avaliacao
            WHERE pasta_id IN (
                SELECT p.id FROM pasta_avaliacoes p
                JOIN assunto s ON p.assunto_id = s.id
                JOIN materia_curricular m ON s.materia_id = m.id
                WHERE m.instituicao_id = :inst_id
            )
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM pasta_avaliacoes
            WHERE assunto_id IN (
                SELECT s.id FROM assunto s
                JOIN materia_curricular m ON s.materia_id = m.id
                WHERE m.instituicao_id = :inst_id
            )
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM assunto
            WHERE materia_id IN (SELECT id FROM materia_curricular WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text("DELETE FROM materia_curricular WHERE instituicao_id = :inst_id"),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM matricula
            WHERE turma_id IN (SELECT id FROM turma WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM aluno_responsavel
            WHERE aluno_id IN (
                SELECT a.id FROM aluno a
                JOIN usuario_conta u ON a.usuario_id = u.id
                WHERE u.instituicao_id = :inst_id
            )
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM aluno
            WHERE usuario_id IN (SELECT id FROM usuario_conta WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM responsavel
            WHERE usuario_id IN (SELECT id FROM usuario_conta WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM professor
            WHERE usuario_id IN (SELECT id FROM usuario_conta WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(
        sa.text(
            """
            DELETE FROM turma_professor
            WHERE turma_id IN (SELECT id FROM turma WHERE instituicao_id = :inst_id)
            """
        ),
        inst_param,
    )
    bind.execute(sa.text("DELETE FROM turma WHERE instituicao_id = :inst_id"), inst_param)
    bind.execute(
        sa.text("DELETE FROM usuario_conta WHERE instituicao_id = :inst_id"),
        inst_param,
    )
    bind.execute(
        sa.text("DELETE FROM instituicao WHERE id = :inst_id"),
        inst_param,
    )
    bind.execute(
        sa.text(
            "DELETE FROM usuario_conta WHERE email = :email AND instituicao_id IS NULL"
        ),
        {"email": "admin@edu.com.br"},
    )
