"""
Seed idempotente — dados demo EduSaaS.

Senha padrão para todos os usuários demo: Demo@2026
"""

from __future__ import annotations

import sys
from datetime import date
from decimal import Decimal

from argon2 import PasswordHasher
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import (
    Aluno,
    AlunoResponsavel,
    Assunto,
    Avaliacao,
    Comunicado,
    ComunicadoDestinatario,
    DashboardFatoDesempenho,
    Instituicao,
    MateriaCurricular,
    Matricula,
    MaterialEstudo,
    PastaAvaliacoes,
    PastaConteudo,
    Professor,
    Questao,
    Responsavel,
    Turma,
    UsuarioConta,
)
from app.models.enums import (
    SituacaoMatricula,
    StatusAvaliacao,
    StatusComunicado,
    StatusConta,
    TipoAnexoMaterial,
    TipoDestinatarioComunicado,
    TipoPerfil,
    TipoQuestao,
)

DEMO_PASSWORD = "Demo@2026"
_ph = PasswordHasher()


def _hash_password(senha: str) -> str:
    return _ph.hash(senha)


def _get_or_create_usuario(
    db,
    *,
    email: str,
    tipo_perfil: TipoPerfil,
    nome_exibicao: str,
    instituicao_id=None,
) -> UsuarioConta:
    if instituicao_id is None:
        stmt = select(UsuarioConta).where(
            UsuarioConta.email == email,
            UsuarioConta.instituicao_id.is_(None),
        )
    else:
        stmt = select(UsuarioConta).where(
            UsuarioConta.email == email,
            UsuarioConta.instituicao_id == instituicao_id,
        )
    usuario = db.scalar(stmt)
    if usuario:
        return usuario
    usuario = UsuarioConta(
        instituicao_id=instituicao_id,
        email=email,
        senha_hash=_hash_password(DEMO_PASSWORD),
        tipo_perfil=tipo_perfil,
        status_conta=StatusConta.ativa,
        nome_exibicao=nome_exibicao,
        preferencias_ui={"tema": "system", "idioma": "pt-BR"},
    )
    db.add(usuario)
    db.flush()
    return usuario


def run_seed() -> None:
    db = SessionLocal()
    try:
        inst = db.scalar(
            select(Instituicao).where(Instituicao.nome_fantasia == "Escola Demo EduSaaS")
        )
        if not inst:
            inst = Instituicao(
                nome_fantasia="Escola Demo EduSaaS",
                documento_legal="00.000.000/0001-00",
                configuracoes_jsonb={"fuso": "America/Sao_Paulo"},
            )
            db.add(inst)
            db.flush()
            print("Criada instituição demo")

        _get_or_create_usuario(
            db,
            email="super@edusaas.local",
            tipo_perfil=TipoPerfil.super_admin,
            nome_exibicao="Super Admin Plataforma",
            instituicao_id=None,
        )

        admin = _get_or_create_usuario(
            db,
            email="admin@demo.edusaas",
            tipo_perfil=TipoPerfil.administrador,
            nome_exibicao="Admin Demo",
            instituicao_id=inst.id,
        )

        prof_user = _get_or_create_usuario(
            db,
            email="professor@demo.edusaas",
            tipo_perfil=TipoPerfil.professor,
            nome_exibicao="Prof. Maria Silva",
            instituicao_id=inst.id,
        )

        aluno_user = _get_or_create_usuario(
            db,
            email="aluno@demo.edusaas",
            tipo_perfil=TipoPerfil.aluno,
            nome_exibicao="João Aluno",
            instituicao_id=inst.id,
        )

        resp_user = _get_or_create_usuario(
            db,
            email="responsavel@demo.edusaas",
            tipo_perfil=TipoPerfil.responsavel,
            nome_exibicao="Ana Responsável",
            instituicao_id=inst.id,
        )

        professor = db.scalar(
            select(Professor).where(Professor.usuario_id == prof_user.id)
        )
        if not professor:
            professor = Professor(usuario_id=prof_user.id, areas_especialidade="Matemática")
            db.add(professor)
            db.flush()

        aluno = db.scalar(select(Aluno).where(Aluno.usuario_id == aluno_user.id))
        if not aluno:
            aluno = Aluno(
                usuario_id=aluno_user.id,
                matricula_codigo="ALU-2026-001",
                data_nascimento=date(2012, 3, 15),
            )
            db.add(aluno)
            db.flush()

        responsavel = db.scalar(
            select(Responsavel).where(Responsavel.usuario_id == resp_user.id)
        )
        if not responsavel:
            responsavel = Responsavel(
                usuario_id=resp_user.id,
                grau_parentesco="Mãe",
                telefone="11999990000",
            )
            db.add(responsavel)
            db.flush()

        vinculo = db.scalar(
            select(AlunoResponsavel).where(
                AlunoResponsavel.aluno_id == aluno.id,
                AlunoResponsavel.responsavel_id == responsavel.id,
            )
        )
        if not vinculo:
            db.add(
                AlunoResponsavel(
                    aluno_id=aluno.id,
                    responsavel_id=responsavel.id,
                    responsavel_principal=True,
                    ordem_contato=1,
                )
            )

        turma = db.scalar(
            select(Turma).where(
                Turma.instituicao_id == inst.id,
                Turma.nome == "3º Ano A",
            )
        )
        if not turma:
            turma = Turma(
                instituicao_id=inst.id,
                professor_titular_id=professor.id,
                nome="3º Ano A",
                ano_letivo="2026",
                turno="manhã",
            )
            db.add(turma)
            db.flush()

        matricula = db.scalar(
            select(Matricula).where(
                Matricula.aluno_id == aluno.id,
                Matricula.turma_id == turma.id,
            )
        )
        if not matricula:
            db.add(
                Matricula(
                    aluno_id=aluno.id,
                    turma_id=turma.id,
                    data_inicio=date(2026, 2, 1),
                    situacao=SituacaoMatricula.ativa,
                )
            )

        materia = db.scalar(
            select(MateriaCurricular).where(
                MateriaCurricular.instituicao_id == inst.id,
                MateriaCurricular.slug == "matematica",
            )
        )
        if not materia:
            materia = MateriaCurricular(
                instituicao_id=inst.id,
                professor_autor_id=professor.id,
                nome="Matemática",
                slug="matematica",
                cor_token_ui="blue",
                ordem=0,
            )
            db.add(materia)
            db.flush()

        assunto = db.scalar(
            select(Assunto).where(
                Assunto.materia_id == materia.id,
                Assunto.nome == "Geral",
            )
        )
        if not assunto:
            assunto = Assunto(materia_id=materia.id, nome="Geral", ordem=0)
            db.add(assunto)
            db.flush()

        pasta_av = db.scalar(
            select(PastaAvaliacoes).where(
                PastaAvaliacoes.assunto_id == assunto.id,
                PastaAvaliacoes.nome == "Provas Bimestre 1",
            )
        )
        if not pasta_av:
            pasta_av = PastaAvaliacoes(
                assunto_id=assunto.id,
                nome="Provas Bimestre 1",
            )
            db.add(pasta_av)
            db.flush()

        avaliacao = db.scalar(
            select(Avaliacao).where(
                Avaliacao.pasta_id == pasta_av.id,
                Avaliacao.titulo == "Avaliação Demo",
            )
        )
        if not avaliacao:
            avaliacao = Avaliacao(
                pasta_id=pasta_av.id,
                titulo="Avaliação Demo",
                status=StatusAvaliacao.rascunho,
            )
            db.add(avaliacao)
            db.flush()

        questao = db.scalar(
            select(Questao).where(
                Questao.avaliacao_id == avaliacao.id,
                Questao.ordem == 1,
            )
        )
        if not questao:
            db.add(
                Questao(
                    avaliacao_id=avaliacao.id,
                    ordem=1,
                    tipo=TipoQuestao.multipla_escolha,
                    enunciado="Quanto é 2 + 2?",
                    alternativas_jsonb=["3", "4", "5", "6"],
                    indice_gabarito=1,
                    peso=Decimal("1"),
                )
            )

        pasta_conteudo = db.scalar(
            select(PastaConteudo).where(
                PastaConteudo.instituicao_id == inst.id,
                PastaConteudo.nome_disciplina == "Matemática",
            )
        )
        if not pasta_conteudo:
            pasta_conteudo = PastaConteudo(
                instituicao_id=inst.id,
                turma_id=turma.id,
                nome_disciplina="Matemática",
                cor_token_ui="blue",
                ordem=0,
            )
            db.add(pasta_conteudo)
            db.flush()

        material = db.scalar(
            select(MaterialEstudo).where(
                MaterialEstudo.pasta_conteudo_id == pasta_conteudo.id,
                MaterialEstudo.titulo == "Nota de revisão",
            )
        )
        if not material:
            db.add(
                MaterialEstudo(
                    pasta_conteudo_id=pasta_conteudo.id,
                    professor_autor_id=professor.id,
                    titulo="Nota de revisão",
                    descricao="Conteúdo introdutório",
                    tipo_anexo=TipoAnexoMaterial.nota,
                    corpo_texto="Bem-vindos à turma!",
                    ordem_exibicao=0,
                )
            )

        comunicado = db.scalar(
            select(Comunicado).where(
                Comunicado.instituicao_id == inst.id,
                Comunicado.titulo == "Comunicado demo rascunho",
            )
        )
        if not comunicado:
            comunicado = Comunicado(
                instituicao_id=inst.id,
                emissor_professor_id=professor.id,
                turma_escopo_id=turma.id,
                titulo="Comunicado demo rascunho",
                corpo="Reunião de pais na próxima semana.",
                status=StatusComunicado.rascunho,
            )
            db.add(comunicado)
            db.flush()
            db.add(
                ComunicadoDestinatario(
                    comunicado_id=comunicado.id,
                    tipo=TipoDestinatarioComunicado.turma,
                    entidade_id=turma.id,
                )
            )

        for periodo, media, taxa in [
            (date(2026, 1, 14), Decimal("7.1"), Decimal("0.88")),
            (date(2026, 2, 10), Decimal("7.4"), Decimal("0.90")),
            (date(2026, 3, 12), Decimal("7.6"), Decimal("0.91")),
            (date(2026, 4, 8), Decimal("7.8"), Decimal("0.93")),
        ]:
            existe = db.scalar(
                select(DashboardFatoDesempenho).where(
                    DashboardFatoDesempenho.instituicao_id == inst.id,
                    DashboardFatoDesempenho.turma_id == turma.id,
                    DashboardFatoDesempenho.aluno_id == aluno.id,
                    DashboardFatoDesempenho.periodo_referencia == periodo,
                )
            )
            if not existe:
                db.add(
                    DashboardFatoDesempenho(
                        instituicao_id=inst.id,
                        turma_id=turma.id,
                        aluno_id=aluno.id,
                        disciplina_id=materia.id,
                        periodo_referencia=periodo,
                        media=media,
                        taxa_aprovacao=taxa,
                        pendentes_correcao=2,
                        fonte="seed",
                    )
                )

        db.commit()
        print("Seed concluído.")
        print(f"  Instituição: {inst.nome_fantasia}")
        print(f"  Senha demo: {DEMO_PASSWORD}")
        print("  Emails: super@edusaas.local, admin@demo.edusaas,")
        print("          professor@demo.edusaas, aluno@demo.edusaas, responsavel@demo.edusaas")
        _ = admin  # evita lint unused
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        run_seed()
    except Exception as exc:
        print(f"Erro no seed: {exc}", file=sys.stderr)
        sys.exit(1)
