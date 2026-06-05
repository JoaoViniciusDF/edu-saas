"""
Seed idempotente — delega ao bootstrap demo (@edu.com.br / admin123).

Opcional após `alembic upgrade head` (dados demo já vêm da migration `002`).

Credenciais demo (senha: admin123):
  admin@edu.com.br       — super_admin (painel /super-admin)
  gestor@edu.com.br      — administrador da Escola Demo Edu
  professor@edu.com.br   — professor (Matemática, Ciências)
  aluno@edu.com.br       — aluno matriculado na turma 3º Ano A
  responsavel@edu.com.br — responsável vinculado a aluno@edu.com.br
"""

from __future__ import annotations

import sys

from scripts.demo_bootstrap import run_demo_bootstrap


def run_seed() -> None:
    run_demo_bootstrap()


if __name__ == "__main__":
    try:
        run_seed()
    except Exception as exc:
        print(f"Erro no seed: {exc}", file=sys.stderr)
        sys.exit(1)
