from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.exceptions import bad_request, conflict, forbidden, not_found, unauthorized
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.enums import SituacaoMatricula, StatusConta, TipoPerfil
from app.models.governanca import (
    Aluno,
    AlunoResponsavel,
    Instituicao,
    Matricula,
    Professor,
    Responsavel,
    Turma,
    UsuarioConta,
)
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, UserMe, UserPreferencesPatch
from app.schemas.common import PaginatedResponse
from app.schemas.configuracoes import (
    AlunoCreate,
    AlunoListItem,
    AlunoPatch,
    InstituicaoCreate,
    InstituicaoPatch,
    InstituicaoResponse,
    MatriculaCreate,
    MatriculaPatch,
    MatriculaResponse,
    ProfessorCreate,
    ProfessorListItem,
    ProfessorPatch,
    ResponsavelCreate,
    ResponsavelListItem,
    ResponsavelVinculoItem,
    SuperAdminResumo,
    TurmaCreate,
    TurmaListItem,
    TurmaPatch,
    VinculoResponsavelCreate,
)


def _user_me(db: Session, usuario: UsuarioConta) -> UserMe:
    prof_id = aluno_id = resp_id = None
    if usuario.professor:
        prof_id = usuario.professor.id
    if usuario.aluno:
        aluno_id = usuario.aluno.id
    if usuario.responsavel:
        resp_id = usuario.responsavel.id
    return UserMe(
        usuario_id=usuario.id,
        email=str(usuario.email),
        nome_exibicao=usuario.nome_exibicao,
        perfil=usuario.tipo_perfil,
        instituicao_id=usuario.instituicao_id,
        preferencias=usuario.preferencias_ui,
        professor_id=prof_id,
        aluno_id=aluno_id,
        responsavel_id=resp_id,
    )


class ConfiguracoesService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def login(self, body: LoginRequest) -> LoginResponse:
        usuario = self.db.scalar(
            select(UsuarioConta).where(func.lower(UsuarioConta.email) == body.email.lower())
        )
        if not usuario or not verify_password(body.senha, usuario.senha_hash):
            raise unauthorized("Credenciais inválidas")
        if usuario.status_conta != StatusConta.ativa:
            raise forbidden("Conta suspensa ou pendente de ativação")
        access = create_access_token(usuario.id, usuario.tipo_perfil, usuario.instituicao_id)
        refresh = create_refresh_token(usuario.id)
        from app.core.config import get_settings

        expira = (
            datetime.now(UTC) + timedelta(minutes=get_settings().jwt_access_minutes)
        ).isoformat()
        return LoginResponse(
            access_token=access,
            refresh_token=refresh,
            expira_em=expira,
            usuario=_user_me(self.db, usuario),
        )

    def refresh(self, body: RefreshRequest) -> LoginResponse:
        from app.core.security import decode_token

        try:
            payload = decode_token(body.refresh_token)
        except Exception:
            raise unauthorized("Refresh token inválido")
        if payload.get("type") != "refresh":
            raise unauthorized("Token inválido")
        usuario = self.db.get(UsuarioConta, uuid.UUID(payload["sub"]))
        if not usuario or usuario.status_conta != StatusConta.ativa:
            raise unauthorized("Usuário inválido")
        access = create_access_token(usuario.id, usuario.tipo_perfil, usuario.instituicao_id)
        refresh = create_refresh_token(usuario.id)
        from app.core.config import get_settings

        expira = (
            datetime.now(UTC) + timedelta(minutes=get_settings().jwt_access_minutes)
        ).isoformat()
        return LoginResponse(
            access_token=access,
            refresh_token=refresh,
            expira_em=expira,
            usuario=_user_me(self.db, usuario),
        )

    def logout(self) -> None:
        return None

    def me(self, user: CurrentUser) -> UserMe:
        return _user_me(self.db, user.usuario)

    def patch_preferences(self, user: CurrentUser, body: UserPreferencesPatch) -> UserMe:
        prefs = dict(user.usuario.preferencias_ui or {})
        for k, v in body.model_dump(exclude_unset=True).items():
            if v is not None:
                prefs[k] = v
        user.usuario.preferencias_ui = prefs
        self.db.commit()
        self.db.refresh(user.usuario)
        return _user_me(self.db, user.usuario)

    def _check_email_unique(self, email: str, instituicao_id: uuid.UUID | None, exclude_id: uuid.UUID | None = None):
        stmt = select(UsuarioConta).where(func.lower(UsuarioConta.email) == email.lower())
        if instituicao_id is None:
            stmt = stmt.where(UsuarioConta.instituicao_id.is_(None))
        else:
            stmt = stmt.where(UsuarioConta.instituicao_id == instituicao_id)
        if exclude_id:
            stmt = stmt.where(UsuarioConta.id != exclude_id)
        if self.db.scalar(stmt):
            raise conflict("E-mail já cadastrado nesta instituição")

    def list_instituicoes(self, cursor: str | None = None, limit: int = 50) -> PaginatedResponse[InstituicaoResponse]:
        stmt = select(Instituicao).order_by(Instituicao.criado_em.desc())
        rows = list(self.db.scalars(stmt.limit(limit + 1)).all())
        has_more = len(rows) > limit
        items = rows[:limit]
        return PaginatedResponse(
            items=[
                InstituicaoResponse(
                    id=i.id,
                    nome_fantasia=i.nome_fantasia,
                    documento_legal=i.documento_legal,
                    configuracoes=i.configuracoes_jsonb,
                )
                for i in items
            ],
            has_more=has_more,
        )

    def create_instituicao(self, body: InstituicaoCreate) -> InstituicaoResponse:
        inst = Instituicao(
            nome_fantasia=body.nome_fantasia,
            documento_legal=body.documento_legal,
            configuracoes_jsonb={},
        )
        self.db.add(inst)
        self.db.flush()
        if body.administrador_inicial:
            self._check_email_unique(body.administrador_inicial.email, inst.id)
            admin_user = UsuarioConta(
                instituicao_id=inst.id,
                email=body.administrador_inicial.email,
                senha_hash=hash_password(body.administrador_inicial.senha),
                tipo_perfil=TipoPerfil.administrador,
                status_conta=StatusConta.ativa,
                nome_exibicao=body.administrador_inicial.nome_exibicao,
            )
            self.db.add(admin_user)
        self.db.commit()
        self.db.refresh(inst)
        return InstituicaoResponse(
            id=inst.id,
            nome_fantasia=inst.nome_fantasia,
            documento_legal=inst.documento_legal,
            configuracoes=inst.configuracoes_jsonb,
        )

    def get_instituicao(self, inst_id: uuid.UUID) -> InstituicaoResponse:
        inst = self.db.get(Instituicao, inst_id)
        if not inst:
            raise not_found()
        return InstituicaoResponse(
            id=inst.id,
            nome_fantasia=inst.nome_fantasia,
            documento_legal=inst.documento_legal,
            configuracoes=inst.configuracoes_jsonb,
        )

    def patch_instituicao(self, inst_id: uuid.UUID, body: InstituicaoPatch) -> InstituicaoResponse:
        inst = self.db.get(Instituicao, inst_id)
        if not inst:
            raise not_found()
        data = body.model_dump(exclude_unset=True)
        if "configuracoes" in data:
            inst.configuracoes_jsonb = data.pop("configuracoes")
        for k, v in data.items():
            setattr(inst, k, v)
        self.db.commit()
        self.db.refresh(inst)
        return self.get_instituicao(inst.id)

    def super_admin_resumo(self) -> SuperAdminResumo:
        return SuperAdminResumo(
            total_instituicoes=self.db.scalar(select(func.count()).select_from(Instituicao)) or 0,
            total_professores=self.db.scalar(select(func.count()).select_from(Professor)) or 0,
            total_turmas=self.db.scalar(select(func.count()).select_from(Turma)) or 0,
            total_alunos=self.db.scalar(select(func.count()).select_from(Aluno)) or 0,
        )

    def super_admin_professores(
        self, instituicao_id: uuid.UUID | None = None
    ) -> list[ProfessorListItem]:
        stmt = (
            select(Professor, UsuarioConta, Instituicao)
            .join(UsuarioConta, Professor.usuario_id == UsuarioConta.id)
            .outerjoin(Instituicao, UsuarioConta.instituicao_id == Instituicao.id)
        )
        if instituicao_id:
            stmt = stmt.where(UsuarioConta.instituicao_id == instituicao_id)
        rows = self.db.execute(stmt).all()
        return [
            ProfessorListItem(
                id=p.id,
                usuario_id=p.usuario_id,
                nome_exibicao=u.nome_exibicao,
                email=str(u.email),
                registro_funcional=p.registro_funcional,
                instituicao_id=u.instituicao_id,
                instituicao_nome=i.nome_fantasia if i else None,
            )
            for p, u, i in rows
        ]

    def super_admin_turmas(self, instituicao_id: uuid.UUID | None = None) -> list[TurmaListItem]:
        stmt = select(Turma)
        if instituicao_id:
            stmt = stmt.where(Turma.instituicao_id == instituicao_id)
        turmas = self.db.scalars(stmt).all()
        result = []
        for t in turmas:
            count = self.db.scalar(
                select(func.count())
                .select_from(Matricula)
                .where(Matricula.turma_id == t.id, Matricula.situacao == SituacaoMatricula.ativa)
            )
            prof_nome = None
            if t.professor_titular_id:
                prof = self.db.get(Professor, t.professor_titular_id)
                if prof and prof.usuario:
                    prof_nome = prof.usuario.nome_exibicao
            result.append(
                TurmaListItem(
                    id=t.id,
                    nome=t.nome,
                    ano_letivo=t.ano_letivo,
                    turno=t.turno,
                    professor_titular_nome=prof_nome,
                    contagem_alunos=count or 0,
                )
            )
        return result

    def list_professores(self, inst_id: uuid.UUID) -> list[ProfessorListItem]:
        rows = self.db.execute(
            select(Professor, UsuarioConta)
            .join(UsuarioConta, Professor.usuario_id == UsuarioConta.id)
            .where(UsuarioConta.instituicao_id == inst_id)
        ).all()
        return [
            ProfessorListItem(
                id=p.id,
                usuario_id=p.usuario_id,
                nome_exibicao=u.nome_exibicao,
                email=str(u.email),
                registro_funcional=p.registro_funcional,
                instituicao_id=inst_id,
            )
            for p, u in rows
        ]

    def create_professor(self, inst_id: uuid.UUID, body: ProfessorCreate) -> ProfessorListItem:
        self._check_email_unique(body.email, inst_id)
        usuario = UsuarioConta(
            instituicao_id=inst_id,
            email=body.email,
            senha_hash=hash_password(body.senha),
            tipo_perfil=TipoPerfil.professor,
            status_conta=StatusConta.ativa,
            nome_exibicao=body.nome_exibicao,
        )
        self.db.add(usuario)
        self.db.flush()
        prof = Professor(
            usuario_id=usuario.id,
            registro_funcional=body.registro_funcional,
            areas_especialidade=body.areas_especialidade,
        )
        self.db.add(prof)
        self.db.commit()
        self.db.refresh(prof)
        return ProfessorListItem(
            id=prof.id,
            usuario_id=usuario.id,
            nome_exibicao=usuario.nome_exibicao,
            email=str(usuario.email),
            registro_funcional=prof.registro_funcional,
            instituicao_id=inst_id,
        )

    def get_professor(self, inst_id: uuid.UUID, prof_id: uuid.UUID) -> ProfessorListItem:
        prof = self.db.get(Professor, prof_id)
        if not prof or not prof.usuario or prof.usuario.instituicao_id != inst_id:
            raise not_found()
        u = prof.usuario
        return ProfessorListItem(
            id=prof.id,
            usuario_id=u.id,
            nome_exibicao=u.nome_exibicao,
            email=str(u.email),
            registro_funcional=prof.registro_funcional,
            instituicao_id=inst_id,
        )

    def patch_professor(
        self, inst_id: uuid.UUID, prof_id: uuid.UUID, body: ProfessorPatch
    ) -> ProfessorListItem:
        prof = self.db.get(Professor, prof_id)
        if not prof or not prof.usuario or prof.usuario.instituicao_id != inst_id:
            raise not_found()
        if body.nome_exibicao:
            prof.usuario.nome_exibicao = body.nome_exibicao
        if body.registro_funcional is not None:
            prof.registro_funcional = body.registro_funcional
        if body.areas_especialidade is not None:
            prof.areas_especialidade = body.areas_especialidade
        self.db.commit()
        return self.get_professor(inst_id, prof_id)

    def delete_professor(self, inst_id: uuid.UUID, prof_id: uuid.UUID) -> None:
        prof = self.db.get(Professor, prof_id)
        if not prof or not prof.usuario or prof.usuario.instituicao_id != inst_id:
            raise not_found()
        prof.usuario.status_conta = StatusConta.suspensa
        self.db.commit()

    def list_alunos(self, inst_id: uuid.UUID) -> list[AlunoListItem]:
        rows = self.db.execute(
            select(Aluno, UsuarioConta)
            .join(UsuarioConta, Aluno.usuario_id == UsuarioConta.id)
            .where(UsuarioConta.instituicao_id == inst_id)
        ).all()
        return [
            AlunoListItem(
                id=a.id,
                usuario_id=a.usuario_id,
                nome_exibicao=u.nome_exibicao,
                email=str(u.email),
                matricula_codigo=a.matricula_codigo,
            )
            for a, u in rows
        ]

    def create_aluno(self, inst_id: uuid.UUID, body: AlunoCreate) -> AlunoListItem:
        self._check_email_unique(body.email, inst_id)
        usuario = UsuarioConta(
            instituicao_id=inst_id,
            email=body.email,
            senha_hash=hash_password(body.senha),
            tipo_perfil=TipoPerfil.aluno,
            status_conta=StatusConta.ativa,
            nome_exibicao=body.nome_exibicao,
        )
        self.db.add(usuario)
        self.db.flush()
        aluno = Aluno(
            usuario_id=usuario.id,
            matricula_codigo=body.matricula_codigo,
            data_nascimento=body.data_nascimento,
        )
        self.db.add(aluno)
        self.db.commit()
        self.db.refresh(aluno)
        return AlunoListItem(
            id=aluno.id,
            usuario_id=usuario.id,
            nome_exibicao=usuario.nome_exibicao,
            email=str(usuario.email),
            matricula_codigo=aluno.matricula_codigo,
        )

    def get_aluno(self, inst_id: uuid.UUID, aluno_id: uuid.UUID) -> AlunoListItem:
        aluno = self.db.get(Aluno, aluno_id)
        if not aluno or not aluno.usuario or aluno.usuario.instituicao_id != inst_id:
            raise not_found()
        u = aluno.usuario
        return AlunoListItem(
            id=aluno.id,
            usuario_id=u.id,
            nome_exibicao=u.nome_exibicao,
            email=str(u.email),
            matricula_codigo=aluno.matricula_codigo,
        )

    def patch_aluno(self, inst_id: uuid.UUID, aluno_id: uuid.UUID, body: AlunoPatch) -> AlunoListItem:
        aluno = self.db.get(Aluno, aluno_id)
        if not aluno or not aluno.usuario or aluno.usuario.instituicao_id != inst_id:
            raise not_found()
        if body.nome_exibicao:
            aluno.usuario.nome_exibicao = body.nome_exibicao
        if body.matricula_codigo is not None:
            aluno.matricula_codigo = body.matricula_codigo
        if body.data_nascimento is not None:
            aluno.data_nascimento = body.data_nascimento
        self.db.commit()
        return self.get_aluno(inst_id, aluno_id)

    def list_responsaveis(self, inst_id: uuid.UUID) -> list[ResponsavelListItem]:
        rows = self.db.execute(
            select(Responsavel, UsuarioConta)
            .join(UsuarioConta, Responsavel.usuario_id == UsuarioConta.id)
            .where(UsuarioConta.instituicao_id == inst_id)
        ).all()
        return [
            ResponsavelListItem(
                id=r.id,
                usuario_id=r.usuario_id,
                nome_exibicao=u.nome_exibicao,
                email=str(u.email),
                grau_parentesco=r.grau_parentesco,
            )
            for r, u in rows
        ]

    def create_responsavel(self, inst_id: uuid.UUID, body: ResponsavelCreate) -> ResponsavelListItem:
        self._check_email_unique(body.email, inst_id)
        usuario = UsuarioConta(
            instituicao_id=inst_id,
            email=body.email,
            senha_hash=hash_password(body.senha),
            tipo_perfil=TipoPerfil.responsavel,
            status_conta=StatusConta.ativa,
            nome_exibicao=body.nome_exibicao,
        )
        self.db.add(usuario)
        self.db.flush()
        resp = Responsavel(
            usuario_id=usuario.id,
            grau_parentesco=body.grau_parentesco,
            telefone=body.telefone,
        )
        self.db.add(resp)
        self.db.commit()
        self.db.refresh(resp)
        return ResponsavelListItem(
            id=resp.id,
            usuario_id=usuario.id,
            nome_exibicao=usuario.nome_exibicao,
            email=str(usuario.email),
            grau_parentesco=resp.grau_parentesco,
        )

    def get_responsavel(self, inst_id: uuid.UUID, resp_id: uuid.UUID) -> ResponsavelListItem:
        resp = self.db.get(Responsavel, resp_id)
        if not resp or not resp.usuario or resp.usuario.instituicao_id != inst_id:
            raise not_found()
        u = resp.usuario
        return ResponsavelListItem(
            id=resp.id,
            usuario_id=u.id,
            nome_exibicao=u.nome_exibicao,
            email=str(u.email),
            grau_parentesco=resp.grau_parentesco,
        )

    def vincular_responsavel(
        self, inst_id: uuid.UUID, aluno_id: uuid.UUID, body: VinculoResponsavelCreate
    ) -> None:
        aluno = self.get_aluno(inst_id, aluno_id)
        resp = self.get_responsavel(inst_id, body.responsavel_id)
        existing = self.db.scalar(
            select(AlunoResponsavel).where(
                AlunoResponsavel.aluno_id == aluno.id,
                AlunoResponsavel.responsavel_id == resp.id,
            )
        )
        if existing:
            raise conflict("Vínculo já existe")
        self.db.add(
            AlunoResponsavel(
                aluno_id=aluno.id,
                responsavel_id=resp.id,
                responsavel_principal=body.responsavel_principal,
            )
        )
        self.db.commit()

    def desvincular_responsavel(
        self, inst_id: uuid.UUID, aluno_id: uuid.UUID, responsavel_id: uuid.UUID
    ) -> None:
        self.get_aluno(inst_id, aluno_id)
        v = self.db.scalar(
            select(AlunoResponsavel).where(
                AlunoResponsavel.aluno_id == aluno_id,
                AlunoResponsavel.responsavel_id == responsavel_id,
            )
        )
        if not v:
            raise not_found()
        self.db.delete(v)
        self.db.commit()

    def list_turmas_cadastro(self, inst_id: uuid.UUID) -> list[TurmaListItem]:
        return self._turmas_list(inst_id, None)

    def create_turma(self, inst_id: uuid.UUID, body: TurmaCreate) -> TurmaListItem:
        turma = Turma(
            instituicao_id=inst_id,
            nome=body.nome,
            ano_letivo=body.ano_letivo,
            turno=body.turno,
            professor_titular_id=body.professor_titular_id,
        )
        self.db.add(turma)
        self.db.commit()
        self.db.refresh(turma)
        return self._turma_item(turma)

    def get_turma_cadastro(self, inst_id: uuid.UUID, turma_id: uuid.UUID) -> TurmaListItem:
        turma = self.db.get(Turma, turma_id)
        if not turma or turma.instituicao_id != inst_id:
            raise not_found()
        return self._turma_item(turma)

    def patch_turma(self, inst_id: uuid.UUID, turma_id: uuid.UUID, body: TurmaPatch) -> TurmaListItem:
        turma = self.db.get(Turma, turma_id)
        if not turma or turma.instituicao_id != inst_id:
            raise not_found()
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(turma, k, v)
        self.db.commit()
        self.db.refresh(turma)
        return self._turma_item(turma)

    def create_matricula(self, inst_id: uuid.UUID, body: MatriculaCreate) -> MatriculaResponse:
        turma = self.db.get(Turma, body.turma_id)
        if not turma or turma.instituicao_id != inst_id:
            raise not_found("Turma não encontrada")
        aluno = self.get_aluno(inst_id, body.aluno_id)
        ativa = self.db.scalar(
            select(Matricula).where(
                Matricula.aluno_id == aluno.id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
        )
        if ativa:
            raise conflict("Aluno já possui matrícula ativa")
        m = Matricula(
            aluno_id=aluno.id,
            turma_id=body.turma_id,
            data_inicio=body.data_inicio,
            situacao=SituacaoMatricula.ativa,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return MatriculaResponse(
            id=m.id,
            aluno_id=m.aluno_id,
            turma_id=m.turma_id,
            data_inicio=m.data_inicio,
            data_fim=m.data_fim,
            situacao=m.situacao,
        )

    def patch_matricula(self, inst_id: uuid.UUID, mat_id: uuid.UUID, body: MatriculaPatch) -> MatriculaResponse:
        m = self.db.get(Matricula, mat_id)
        if not m or not m.turma or m.turma.instituicao_id != inst_id:
            raise not_found()
        if body.situacao:
            m.situacao = body.situacao
        if body.data_fim is not None:
            m.data_fim = body.data_fim
        self.db.commit()
        self.db.refresh(m)
        return MatriculaResponse(
            id=m.id,
            aluno_id=m.aluno_id,
            turma_id=m.turma_id,
            data_inicio=m.data_inicio,
            data_fim=m.data_fim,
            situacao=m.situacao,
        )

    def _instituicao_id_usuario(self, user: CurrentUser) -> uuid.UUID:
        if not user.instituicao_id:
            raise forbidden("Instituição obrigatória")
        return user.instituicao_id

    def _turma_acessivel(self, user: CurrentUser, turma_id: uuid.UUID) -> Turma:
        turma = self.db.get(Turma, turma_id)
        if not turma or turma.instituicao_id != user.instituicao_id:
            raise not_found()
        if user.perfil == TipoPerfil.professor and turma.professor_titular_id != user.professor_id:
            raise forbidden("Turma fora do seu escopo")
        return turma

    def _aluno_acessivel(self, user: CurrentUser, aluno_id: uuid.UUID) -> Aluno:
        inst_id = self._instituicao_id_usuario(user)
        aluno = self.db.get(Aluno, aluno_id)
        if not aluno or not aluno.usuario or aluno.usuario.instituicao_id != inst_id:
            raise not_found()
        if user.perfil == TipoPerfil.professor:
            vinculo = self.db.scalar(
                select(Matricula.id)
                .join(Turma, Matricula.turma_id == Turma.id)
                .where(
                    Matricula.aluno_id == aluno_id,
                    Matricula.situacao == SituacaoMatricula.ativa,
                    Turma.professor_titular_id == user.professor_id,
                )
            )
            if not vinculo:
                raise forbidden("Aluno fora das suas turmas")
        return aluno

    def list_alunos_scoped(self, user: CurrentUser) -> list[AlunoListItem]:
        inst_id = self._instituicao_id_usuario(user)
        if user.perfil != TipoPerfil.professor:
            return self.list_alunos(inst_id)
        rows = self.db.execute(
            select(Aluno, UsuarioConta)
            .join(UsuarioConta, Aluno.usuario_id == UsuarioConta.id)
            .join(Matricula, Matricula.aluno_id == Aluno.id)
            .join(Turma, Matricula.turma_id == Turma.id)
            .where(
                Turma.professor_titular_id == user.professor_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
            .distinct()
        ).all()
        return [
            AlunoListItem(
                id=a.id,
                usuario_id=a.usuario_id,
                nome_exibicao=u.nome_exibicao,
                email=str(u.email),
                matricula_codigo=a.matricula_codigo,
            )
            for a, u in rows
        ]

    def create_aluno_scoped(self, user: CurrentUser, body: AlunoCreate) -> AlunoListItem:
        return self.create_aluno(self._instituicao_id_usuario(user), body)

    def get_aluno_scoped_cadastro(self, user: CurrentUser, aluno_id: uuid.UUID) -> AlunoListItem:
        self._aluno_acessivel(user, aluno_id)
        return self.get_aluno(self._instituicao_id_usuario(user), aluno_id)

    def patch_aluno_scoped(
        self, user: CurrentUser, aluno_id: uuid.UUID, body: AlunoPatch
    ) -> AlunoListItem:
        self._aluno_acessivel(user, aluno_id)
        return self.patch_aluno(self._instituicao_id_usuario(user), aluno_id, body)

    def list_responsaveis_scoped(self, user: CurrentUser) -> list[ResponsavelListItem]:
        return self.list_responsaveis(self._instituicao_id_usuario(user))

    def create_responsavel_scoped(
        self, user: CurrentUser, body: ResponsavelCreate
    ) -> ResponsavelListItem:
        return self.create_responsavel(self._instituicao_id_usuario(user), body)

    def get_responsavel_scoped(self, user: CurrentUser, resp_id: uuid.UUID) -> ResponsavelListItem:
        return self.get_responsavel(self._instituicao_id_usuario(user), resp_id)

    def vincular_responsavel_scoped(
        self, user: CurrentUser, aluno_id: uuid.UUID, body: VinculoResponsavelCreate
    ) -> None:
        self._aluno_acessivel(user, aluno_id)
        self.vincular_responsavel(self._instituicao_id_usuario(user), aluno_id, body)

    def desvincular_responsavel_scoped(
        self, user: CurrentUser, aluno_id: uuid.UUID, responsavel_id: uuid.UUID
    ) -> None:
        self._aluno_acessivel(user, aluno_id)
        self.desvincular_responsavel(
            self._instituicao_id_usuario(user), aluno_id, responsavel_id
        )

    def create_turma_scoped(self, user: CurrentUser, body: TurmaCreate) -> TurmaListItem:
        inst_id = self._instituicao_id_usuario(user)
        data = body.model_dump()
        if user.perfil == TipoPerfil.professor:
            data["professor_titular_id"] = user.professor_id
        return self.create_turma(inst_id, TurmaCreate(**data))

    def patch_turma_scoped(
        self, user: CurrentUser, turma_id: uuid.UUID, body: TurmaPatch
    ) -> TurmaListItem:
        self._turma_acessivel(user, turma_id)
        return self.patch_turma(self._instituicao_id_usuario(user), turma_id, body)

    def create_matricula_scoped(
        self, user: CurrentUser, body: MatriculaCreate
    ) -> MatriculaResponse:
        self._turma_acessivel(user, body.turma_id)
        return self.create_matricula(self._instituicao_id_usuario(user), body)

    def patch_matricula_scoped(
        self, user: CurrentUser, mat_id: uuid.UUID, body: MatriculaPatch
    ) -> MatriculaResponse:
        m = self.db.get(Matricula, mat_id)
        if not m:
            raise not_found()
        self._turma_acessivel(user, m.turma_id)
        return self.patch_matricula(self._instituicao_id_usuario(user), mat_id, body)

    def patch_instituicao_scoped(
        self, user: CurrentUser, inst_id: uuid.UUID, body: InstituicaoPatch
    ) -> InstituicaoResponse:
        if user.perfil != TipoPerfil.administrador or user.instituicao_id != inst_id:
            raise forbidden("Apenas administrador da instituição")
        return self.patch_instituicao(inst_id, body)

    def get_instituicao_scoped(self, user: CurrentUser, inst_id: uuid.UUID) -> InstituicaoResponse:
        if user.perfil != TipoPerfil.super_admin and user.instituicao_id != inst_id:
            raise not_found()
        return self.get_instituicao(inst_id)

    def _turma_item(self, turma: Turma) -> TurmaListItem:
        count = self.db.scalar(
            select(func.count())
            .select_from(Matricula)
            .where(Matricula.turma_id == turma.id, Matricula.situacao == SituacaoMatricula.ativa)
        )
        prof_nome = None
        if turma.professor_titular_id:
            prof = self.db.get(Professor, turma.professor_titular_id)
            if prof and prof.usuario:
                prof_nome = prof.usuario.nome_exibicao
        return TurmaListItem(
            id=turma.id,
            nome=turma.nome,
            ano_letivo=turma.ano_letivo,
            turno=turma.turno,
            professor_titular_nome=prof_nome,
            contagem_alunos=count or 0,
        )

    def _turmas_list(
        self, inst_id: uuid.UUID | None, user: CurrentUser | None
    ) -> list[TurmaListItem]:
        stmt = select(Turma)
        if inst_id:
            stmt = stmt.where(Turma.instituicao_id == inst_id)
        elif user and user.perfil == TipoPerfil.professor and user.professor_id:
            stmt = stmt.where(Turma.professor_titular_id == user.professor_id)
        elif user and user.perfil == TipoPerfil.aluno and user.aluno_id:
            stmt = stmt.join(Matricula, Matricula.turma_id == Turma.id).where(
                Matricula.aluno_id == user.aluno_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
        elif user and user.perfil == TipoPerfil.responsavel and user.responsavel_id:
            aluno_ids = select(AlunoResponsavel.aluno_id).where(
                AlunoResponsavel.responsavel_id == user.responsavel_id
            )
            stmt = stmt.join(Matricula, Matricula.turma_id == Turma.id).where(
                Matricula.aluno_id.in_(aluno_ids),
                Matricula.situacao == SituacaoMatricula.ativa,
            )
        turmas = self.db.scalars(stmt).unique().all()
        return [self._turma_item(t) for t in turmas]

    def list_turmas(self, user: CurrentUser, nome: str | None = None) -> list[TurmaListItem]:
        inst_id = user.instituicao_id
        if not inst_id and user.perfil != TipoPerfil.super_admin:
            raise forbidden()
        items = self._turmas_list(inst_id, user)
        if nome:
            items = [t for t in items if nome.lower() in t.nome.lower()]
        return items

    def get_turma(self, user: CurrentUser, turma_id: uuid.UUID) -> TurmaListItem:
        turma = self.db.get(Turma, turma_id)
        if not turma:
            raise not_found()
        if user.perfil != TipoPerfil.super_admin and turma.instituicao_id != user.instituicao_id:
            raise not_found()
        return self._turma_item(turma)

    def list_turma_alunos(self, user: CurrentUser, turma_id: uuid.UUID) -> list[AlunoListItem]:
        self.get_turma(user, turma_id)
        rows = self.db.execute(
            select(Aluno, UsuarioConta)
            .join(Matricula, Matricula.aluno_id == Aluno.id)
            .join(UsuarioConta, Aluno.usuario_id == UsuarioConta.id)
            .where(
                Matricula.turma_id == turma_id,
                Matricula.situacao == SituacaoMatricula.ativa,
            )
        ).all()
        return [
            AlunoListItem(
                id=a.id,
                usuario_id=a.usuario_id,
                nome_exibicao=u.nome_exibicao,
                email=str(u.email),
                matricula_codigo=a.matricula_codigo,
            )
            for a, u in rows
        ]

    def get_aluno_scoped(self, user: CurrentUser, aluno_id: uuid.UUID) -> AlunoListItem:
        aluno = self.db.get(Aluno, aluno_id)
        if not aluno or not aluno.usuario:
            raise not_found()
        if user.perfil == TipoPerfil.aluno and user.aluno_id != aluno_id:
            raise not_found()
        if user.perfil == TipoPerfil.responsavel:
            v = self.db.scalar(
                select(AlunoResponsavel).where(
                    AlunoResponsavel.aluno_id == aluno_id,
                    AlunoResponsavel.responsavel_id == user.responsavel_id,
                )
            )
            if not v:
                raise not_found()
        elif user.perfil not in (TipoPerfil.super_admin, TipoPerfil.administrador, TipoPerfil.professor):
            raise not_found()
        elif user.instituicao_id and aluno.usuario.instituicao_id != user.instituicao_id:
            raise not_found()
        u = aluno.usuario
        return AlunoListItem(
            id=aluno.id,
            usuario_id=u.id,
            nome_exibicao=u.nome_exibicao,
            email=str(u.email),
            matricula_codigo=aluno.matricula_codigo,
        )

    def list_aluno_responsaveis(
        self, user: CurrentUser, aluno_id: uuid.UUID
    ) -> list[ResponsavelVinculoItem]:
        self.get_aluno_scoped(user, aluno_id)
        rows = self.db.execute(
            select(AlunoResponsavel, Responsavel, UsuarioConta)
            .join(Responsavel, AlunoResponsavel.responsavel_id == Responsavel.id)
            .join(UsuarioConta, Responsavel.usuario_id == UsuarioConta.id)
            .where(AlunoResponsavel.aluno_id == aluno_id)
        ).all()
        return [
            ResponsavelVinculoItem(
                id=r.id,
                nome_exibicao=u.nome_exibicao,
                grau_parentesco=r.grau_parentesco,
                responsavel_principal=ar.responsavel_principal,
            )
            for ar, r, u in rows
        ]
