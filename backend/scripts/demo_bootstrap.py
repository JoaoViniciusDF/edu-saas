"""
Bootstrap idempotente — dados demo EduSaaS (@edu.com.br / admin123).

Usado pela migration Alembic 002 e opcionalmente por `python -m scripts.seed`.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    Aluno,
    AlunoResponsavel,
    Assunto,
    Avaliacao,
    Comunicado,
    ComunicadoDestinatario,
    ComunicadoDestinatarioEfetivo,
    DashboardFatoDesempenho,
    Instituicao,
    MateriaCurricular,
    Matricula,
    MaterialEstudo,
    PastaAvaliacoes,
    PastaConteudo,
    Professor,
    Questao,
    RespostaQuestao,
    Responsavel,
    Submissao,
    Turma,
    TurmaProfessor,
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

DEMO_PASSWORD = "admin123"
INSTITUICAO_NOME = "Escola Demo Edu"

MATERIAS_DEMO = [
    {
        "nome": "Matemática",
        "slug": "matematica",
        "cor": "blue",
        "professor_email": "professor@edu.com.br",
    },
    {
        "nome": "Português",
        "slug": "portugues",
        "cor": "green",
        "professor_email": "professor2@edu.com.br",
    },
    {
        "nome": "Ciências",
        "slug": "ciencias",
        "cor": "orange",
        "professor_email": "professor@edu.com.br",
    },
]


def _limpar_avaliacoes_demo(db: Session, instituicao_id: Any) -> None:
    """Remove avaliações/questões do seed antigo; provas são criadas manualmente na demo."""
    materia_ids = db.scalars(
        select(MateriaCurricular.id).where(
            MateriaCurricular.instituicao_id == instituicao_id
        )
    ).all()
    if not materia_ids:
        return

    assunto_ids = db.scalars(
        select(Assunto.id).where(Assunto.materia_id.in_(materia_ids))
    ).all()
    if not assunto_ids:
        return

    pasta_ids = db.scalars(
        select(PastaAvaliacoes.id).where(PastaAvaliacoes.assunto_id.in_(assunto_ids))
    ).all()
    if not pasta_ids:
        return

    avaliacao_ids = db.scalars(
        select(Avaliacao.id).where(Avaliacao.pasta_id.in_(pasta_ids))
    ).all()
    if avaliacao_ids:
        submissao_ids = db.scalars(
            select(Submissao.id).where(Submissao.avaliacao_id.in_(avaliacao_ids))
        ).all()
        if submissao_ids:
            db.execute(
                delete(RespostaQuestao).where(
                    RespostaQuestao.submissao_id.in_(submissao_ids)
                )
            )
            db.execute(delete(Submissao).where(Submissao.id.in_(submissao_ids)))
        db.execute(delete(Questao).where(Questao.avaliacao_id.in_(avaliacao_ids)))
        db.execute(delete(Avaliacao).where(Avaliacao.id.in_(avaliacao_ids)))

    db.execute(delete(PastaAvaliacoes).where(PastaAvaliacoes.id.in_(pasta_ids)))
    db.flush()


def _expandir_destinatarios_comunicado(db: Session, comunicado: Comunicado) -> None:
    usuario_ids: set[Any] = set()
    for d in comunicado.destinatarios:
        if d.tipo == TipoDestinatarioComunicado.aluno:
            aluno = db.get(Aluno, d.entidade_id)
            if aluno:
                usuario_ids.add(aluno.usuario_id)
        elif d.tipo == TipoDestinatarioComunicado.turma:
            matriculas = db.scalars(
                select(Matricula).where(
                    Matricula.turma_id == d.entidade_id,
                    Matricula.situacao == SituacaoMatricula.ativa,
                )
            ).all()
            for mat in matriculas:
                aluno = db.get(Aluno, mat.aluno_id)
                if aluno:
                    usuario_ids.add(aluno.usuario_id)
        elif d.tipo == TipoDestinatarioComunicado.responsavel:
            resp = db.get(Responsavel, d.entidade_id)
            if resp:
                usuario_ids.add(resp.usuario_id)
        elif d.tipo == TipoDestinatarioComunicado.professor:
            prof = db.get(Professor, d.entidade_id)
            if prof:
                usuario_ids.add(prof.usuario_id)
    for uid in usuario_ids:
        existe = db.scalar(
            select(ComunicadoDestinatarioEfetivo).where(
                ComunicadoDestinatarioEfetivo.comunicado_id == comunicado.id,
                ComunicadoDestinatarioEfetivo.usuario_id == uid,
            )
        )
        if not existe:
            db.add(ComunicadoDestinatarioEfetivo(comunicado_id=comunicado.id, usuario_id=uid))


def _seed_avaliacao_demo(
    db: Session,
    *,
    materia: MateriaCurricular,
    turma: Turma,
    professor: Professor,
) -> None:
    assunto = db.scalar(
        select(Assunto).where(Assunto.materia_id == materia.id, Assunto.nome == "Unidade 1")
    )
    if not assunto:
        return

    pasta = db.scalar(
        select(PastaAvaliacoes).where(
            PastaAvaliacoes.assunto_id == assunto.id,
            PastaAvaliacoes.nome == "Prova 1 — Unidade",
        )
    )
    if not pasta:
        pasta = PastaAvaliacoes(assunto_id=assunto.id, nome="Prova 1 — Unidade")
        db.add(pasta)
        db.flush()

    av = db.scalar(
        select(Avaliacao).where(
            Avaliacao.pasta_id == pasta.id,
            Avaliacao.titulo == "Avaliação diagnóstica — Matemática",
        )
    )
    if not av:
        av = Avaliacao(
            pasta_id=pasta.id,
            turma_id=turma.id,
            titulo="Avaliação diagnóstica — Matemática",
            status=StatusAvaliacao.publicada,
            publicado_em=datetime.now(UTC),
            prazo_utc=datetime.now(UTC) + timedelta(days=30),
            versao=1,
        )
        db.add(av)
        db.flush()
        db.add(
            Questao(
                avaliacao_id=av.id,
                ordem=1,
                tipo=TipoQuestao.multipla_escolha,
                enunciado="Quanto é 2 + 2?",
                alternativas_jsonb=["3", "4", "5", "6"],
                indice_gabarito=1,
                peso=Decimal("1"),
            )
        )
        db.add(
            Questao(
                avaliacao_id=av.id,
                ordem=2,
                tipo=TipoQuestao.multipla_escolha,
                enunciado="Qual é o dobro de 5?",
                alternativas_jsonb=["8", "10", "12", "15"],
                indice_gabarito=1,
                peso=Decimal("1"),
            )
        )


def _get_or_create_usuario(
    db: Session,
    *,
    email: str,
    tipo_perfil: TipoPerfil,
    nome_exibicao: str,
    instituicao_id: Any = None,
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
    senha_hash = hash_password(DEMO_PASSWORD)
    if usuario:
        usuario.senha_hash = senha_hash
        usuario.status_conta = StatusConta.ativa
        usuario.nome_exibicao = nome_exibicao
        db.flush()
        return usuario
    usuario = UsuarioConta(
        instituicao_id=instituicao_id,
        email=email,
        senha_hash=senha_hash,
        tipo_perfil=tipo_perfil,
        status_conta=StatusConta.ativa,
        nome_exibicao=nome_exibicao,
        preferencias_ui={"tema": "system", "idioma": "pt-BR"},
    )
    db.add(usuario)
    db.flush()
    return usuario


def _get_or_create_professor(db: Session, usuario: UsuarioConta, areas: str) -> Professor:
    professor = db.scalar(select(Professor).where(Professor.usuario_id == usuario.id))
    if professor:
        professor.areas_especialidade = areas
        db.flush()
        return professor
    professor = Professor(usuario_id=usuario.id, areas_especialidade=areas)
    db.add(professor)
    db.flush()
    return professor


def _get_or_create_aluno(
    db: Session, usuario: UsuarioConta, matricula_codigo: str, data_nascimento: date
) -> Aluno:
    aluno = db.scalar(select(Aluno).where(Aluno.usuario_id == usuario.id))
    if aluno:
        aluno.matricula_codigo = matricula_codigo
        db.flush()
        return aluno
    aluno = Aluno(
        usuario_id=usuario.id,
        matricula_codigo=matricula_codigo,
        data_nascimento=data_nascimento,
    )
    db.add(aluno)
    db.flush()
    return aluno


def _bootstrap(db: Session) -> Instituicao:
    inst = db.scalar(
        select(Instituicao).where(Instituicao.nome_fantasia == INSTITUICAO_NOME)
    )
    if not inst:
        inst = Instituicao(
            nome_fantasia=INSTITUICAO_NOME,
            documento_legal="00.000.000/0001-99",
            configuracoes_jsonb={"fuso": "America/Sao_Paulo"},
        )
        db.add(inst)
        db.flush()

    _limpar_avaliacoes_demo(db, inst.id)

    _get_or_create_usuario(
        db,
        email="admin@edu.com.br",
        tipo_perfil=TipoPerfil.super_admin,
        nome_exibicao="Admin Plataforma Edu",
        instituicao_id=None,
    )

    _get_or_create_usuario(
        db,
        email="gestor@edu.com.br",
        tipo_perfil=TipoPerfil.administrador,
        nome_exibicao="Gestor da Escola",
        instituicao_id=inst.id,
    )

    prof_user = _get_or_create_usuario(
        db,
        email="professor@edu.com.br",
        tipo_perfil=TipoPerfil.professor,
        nome_exibicao="Prof. Maria Silva",
        instituicao_id=inst.id,
    )
    prof2_user = _get_or_create_usuario(
        db,
        email="professor2@edu.com.br",
        tipo_perfil=TipoPerfil.professor,
        nome_exibicao="Prof. João Santos",
        instituicao_id=inst.id,
    )

    aluno_user = _get_or_create_usuario(
        db,
        email="aluno@edu.com.br",
        tipo_perfil=TipoPerfil.aluno,
        nome_exibicao="Pedro Aluno",
        instituicao_id=inst.id,
    )
    aluno2_user = _get_or_create_usuario(
        db,
        email="aluno2@edu.com.br",
        tipo_perfil=TipoPerfil.aluno,
        nome_exibicao="Ana Aluna",
        instituicao_id=inst.id,
    )

    resp_user = _get_or_create_usuario(
        db,
        email="responsavel@edu.com.br",
        tipo_perfil=TipoPerfil.responsavel,
        nome_exibicao="Carla Responsável",
        instituicao_id=inst.id,
    )

    professores_por_email = {
        "professor@edu.com.br": _get_or_create_professor(db, prof_user, "Matemática e Ciências"),
        "professor2@edu.com.br": _get_or_create_professor(db, prof2_user, "Português"),
    }

    aluno = _get_or_create_aluno(db, aluno_user, "ALU-2026-001", date(2012, 3, 15))
    aluno2 = _get_or_create_aluno(db, aluno2_user, "ALU-2026-002", date(2012, 8, 20))

    responsavel = db.scalar(select(Responsavel).where(Responsavel.usuario_id == resp_user.id))
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

    professor_titular = professores_por_email["professor@edu.com.br"]
    turma = db.scalar(
        select(Turma).where(
            Turma.instituicao_id == inst.id,
            Turma.nome == "3º Ano A",
        )
    )
    if not turma:
        turma = Turma(
            instituicao_id=inst.id,
            professor_titular_id=professor_titular.id,
            nome="3º Ano A",
            ano_letivo="2026",
            turno="manhã",
        )
        db.add(turma)
        db.flush()

    for prof_email, prof_ent in professores_por_email.items():
        eh_titular = prof_ent.id == professor_titular.id
        vinculo_tp = db.scalar(
            select(TurmaProfessor).where(
                TurmaProfessor.turma_id == turma.id,
                TurmaProfessor.professor_id == prof_ent.id,
            )
        )
        if not vinculo_tp:
            db.add(
                TurmaProfessor(
                    turma_id=turma.id,
                    professor_id=prof_ent.id,
                    eh_titular=eh_titular,
                )
            )

    for aluno_ent in (aluno, aluno2):
        matricula = db.scalar(
            select(Matricula).where(
                Matricula.aluno_id == aluno_ent.id,
                Matricula.turma_id == turma.id,
            )
        )
        if not matricula:
            db.add(
                Matricula(
                    aluno_id=aluno_ent.id,
                    turma_id=turma.id,
                    data_inicio=date(2026, 2, 1),
                    situacao=SituacaoMatricula.ativa,
                )
            )

    materia_ids: dict[str, Any] = {}
    for spec in MATERIAS_DEMO:
        prof = professores_por_email[spec["professor_email"]]
        materia = db.scalar(
            select(MateriaCurricular).where(
                MateriaCurricular.instituicao_id == inst.id,
                MateriaCurricular.slug == spec["slug"],
            )
        )
        if not materia:
            materia = MateriaCurricular(
                instituicao_id=inst.id,
                professor_autor_id=prof.id,
                nome=spec["nome"],
                slug=spec["slug"],
                cor_token_ui=spec["cor"],
                ordem=0,
            )
            db.add(materia)
            db.flush()
        materia_ids[spec["slug"]] = materia.id

        assunto = db.scalar(
            select(Assunto).where(
                Assunto.materia_id == materia.id,
                Assunto.nome == "Unidade 1",
            )
        )
        if not assunto:
            assunto = Assunto(materia_id=materia.id, nome="Unidade 1", ordem=0)
            db.add(assunto)
            db.flush()

        pasta_conteudo = db.scalar(
            select(PastaConteudo).where(
                PastaConteudo.instituicao_id == inst.id,
                PastaConteudo.nome_disciplina == spec["nome"],
            )
        )
        if not pasta_conteudo:
            pasta_conteudo = PastaConteudo(
                instituicao_id=inst.id,
                turma_id=turma.id,
                nome_disciplina=spec["nome"],
                cor_token_ui=spec["cor"],
                ordem=0,
            )
            db.add(pasta_conteudo)
            db.flush()

        material_titulo = f"Introdução — {spec['nome']}"
        material = db.scalar(
            select(MaterialEstudo).where(
                MaterialEstudo.pasta_conteudo_id == pasta_conteudo.id,
                MaterialEstudo.titulo == material_titulo,
            )
        )
        if not material:
            db.add(
                MaterialEstudo(
                    pasta_conteudo_id=pasta_conteudo.id,
                    professor_autor_id=prof.id,
                    titulo=material_titulo,
                    descricao=f"Material didático de abertura de {spec['nome']}",
                    tipo_anexo=TipoAnexoMaterial.nota,
                    corpo_texto=(
                        f"Bem-vindos à disciplina de {spec['nome']}! "
                        "Nesta unidade revisaremos os conceitos fundamentais."
                    ),
                    ordem_exibicao=0,
                )
            )

    comunicado = db.scalar(
        select(Comunicado).where(
            Comunicado.instituicao_id == inst.id,
            Comunicado.titulo == "Reunião de pais — turma 3º Ano A",
        )
    )
    if not comunicado:
        comunicado = Comunicado(
            instituicao_id=inst.id,
            emissor_professor_id=professor_titular.id,
            turma_escopo_id=turma.id,
            titulo="Reunião de pais — turma 3º Ano A",
            corpo="Convidamos os responsáveis para reunião na próxima semana, às 19h.",
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

    dest_turma = db.scalar(
        select(ComunicadoDestinatario).where(
            ComunicadoDestinatario.comunicado_id == comunicado.id,
            ComunicadoDestinatario.tipo == TipoDestinatarioComunicado.turma,
        )
    )
    if not dest_turma:
        db.add(
            ComunicadoDestinatario(
                comunicado_id=comunicado.id,
                tipo=TipoDestinatarioComunicado.turma,
                entidade_id=turma.id,
            )
        )
        db.flush()
    if comunicado.status == StatusComunicado.rascunho:
        comunicado.status = StatusComunicado.publicado
        db.flush()
    _expandir_destinatarios_comunicado(db, comunicado)

    materia_mat = db.scalar(
        select(MateriaCurricular).where(
            MateriaCurricular.instituicao_id == inst.id,
            MateriaCurricular.slug == "matematica",
        )
    )
    if materia_mat:
        _seed_avaliacao_demo(
            db,
            materia=materia_mat,
            turma=turma,
            professor=professor_titular,
        )

        for periodo, media, taxa in [
            (date(2026, 1, 14), Decimal("7.1"), Decimal("0.88")),
            (date(2026, 2, 10), Decimal("7.4"), Decimal("0.90")),
            (date(2026, 3, 12), Decimal("7.6"), Decimal("0.91")),
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
                        disciplina_id=materia_mat.id,
                        periodo_referencia=periodo,
                        media=media,
                        taxa_aprovacao=taxa,
                        pendentes_correcao=2,
                        fonte="demo_bootstrap",
                    )
                )

    return inst


def run_demo_bootstrap(bind: Any | None = None) -> None:
    """Executa bootstrap demo; aceita bind do Alembic ou usa SessionLocal."""
    if bind is not None:
        factory = sessionmaker(bind=bind, autocommit=False, autoflush=False)
        db = factory()
    else:
        db = SessionLocal()

    try:
        inst = _bootstrap(db)
        db.commit()
        print("Bootstrap demo concluído.")
        print(f"  Instituição: {inst.nome_fantasia}")
        print(f"  Senha (todos): {DEMO_PASSWORD}")
        print("")
        print("  --- Credenciais demo ---")
        print("  admin@edu.com.br       super_admin  → /super-admin")
        print("  gestor@edu.com.br      administrador → /configuracoes")
        print("  professor@edu.com.br   professor     → /conteudo, /avaliacoes")
        print("  professor2@edu.com.br  professor     → /conteudo (Português)")
        print("  aluno@edu.com.br       aluno         → /aluno/provas")
        print("  aluno2@edu.com.br      aluno         → /aluno/provas")
        print("  responsavel@edu.com.br responsavel   → /dashboard")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

