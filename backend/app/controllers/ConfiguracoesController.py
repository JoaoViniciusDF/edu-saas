from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
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
from app.services.configuracoes_service import ConfiguracoesService

router = APIRouter(tags=["Configurações"])

AdminUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.administrador))]
SuperAdminUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.super_admin))]
CadastroGestaoUser = Annotated[
    CurrentUser,
    Depends(require_perfis(TipoPerfil.administrador, TipoPerfil.professor)),
]


def _svc(db: DbSession) -> ConfiguracoesService:
    return ConfiguracoesService(db)


@router.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest, db: DbSession) -> LoginResponse:
    return _svc(db).login(body)


@router.post("/auth/refresh", response_model=LoginResponse)
def refresh(body: RefreshRequest, db: DbSession) -> LoginResponse:
    return _svc(db).refresh(body)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(db: DbSession) -> Response:
    _svc(db).logout()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/auth/me", response_model=UserMe)
def auth_me(user: AuthUser, db: DbSession) -> UserMe:
    return _svc(db).me(user)


@router.patch("/users/me/preferences", response_model=UserMe)
def patch_preferences(
    body: UserPreferencesPatch, user: AuthUser, db: DbSession
) -> UserMe:
    return _svc(db).patch_preferences(user, body)


@router.get("/admin/instituicoes", response_model=PaginatedResponse[InstituicaoResponse])
def list_instituicoes(
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
    cursor: str | None = None,
    limit: int = 50,
) -> PaginatedResponse[InstituicaoResponse]:
    return _svc(db).list_instituicoes(cursor, limit)


@router.post("/admin/instituicoes", response_model=InstituicaoResponse, status_code=201)
def create_instituicao(
    body: InstituicaoCreate,
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
) -> InstituicaoResponse:
    return _svc(db).create_instituicao(body)


@router.get("/admin/instituicoes/{inst_id}", response_model=InstituicaoResponse)
def get_instituicao_admin(
    inst_id: uuid.UUID,
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
) -> InstituicaoResponse:
    return _svc(db).get_instituicao(inst_id)


@router.patch("/admin/instituicoes/{inst_id}", response_model=InstituicaoResponse)
def patch_instituicao_admin(
    inst_id: uuid.UUID,
    body: InstituicaoPatch,
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
) -> InstituicaoResponse:
    return _svc(db).patch_instituicao(inst_id, body)


@router.get("/super-admin/professores", response_model=list[ProfessorListItem])
def super_admin_professores(
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
    instituicao_id: uuid.UUID | None = None,
) -> list[ProfessorListItem]:
    return _svc(db).super_admin_professores(instituicao_id)


@router.get("/super-admin/turmas", response_model=list[TurmaListItem])
def super_admin_turmas(
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
    instituicao_id: uuid.UUID | None = None,
) -> list[TurmaListItem]:
    return _svc(db).super_admin_turmas(instituicao_id)


@router.get("/super-admin/resumo", response_model=SuperAdminResumo)
def super_admin_resumo(
    db: DbSession,
    _: Annotated[object, Depends(require_perfis(TipoPerfil.super_admin))],
) -> SuperAdminResumo:
    return _svc(db).super_admin_resumo()


@router.get("/cadastros/professores", response_model=list[ProfessorListItem])
def list_professores(
    user: Annotated[object, Depends(require_perfis(TipoPerfil.administrador))],
    db: DbSession,
) -> list[ProfessorListItem]:
    u = user  # type: ignore[assignment]
    return _svc(db).list_professores(u.instituicao_id)  # type: ignore[attr-defined]


@router.post("/cadastros/professores", response_model=ProfessorListItem, status_code=201)
def create_professor(
    body: ProfessorCreate,
    user: Annotated[object, Depends(require_perfis(TipoPerfil.administrador))],
    db: DbSession,
) -> ProfessorListItem:
    u = user  # type: ignore[assignment]
    return _svc(db).create_professor(u.instituicao_id, body)  # type: ignore[attr-defined]


@router.get("/cadastros/professores/{prof_id}", response_model=ProfessorListItem)
def get_professor(
    prof_id: uuid.UUID,
    user: Annotated[object, Depends(require_perfis(TipoPerfil.administrador))],
    db: DbSession,
) -> ProfessorListItem:
    u = user  # type: ignore[assignment]
    return _svc(db).get_professor(u.instituicao_id, prof_id)  # type: ignore[attr-defined]


@router.patch("/cadastros/professores/{prof_id}", response_model=ProfessorListItem)
def patch_professor(
    prof_id: uuid.UUID,
    body: ProfessorPatch,
    user: Annotated[object, Depends(require_perfis(TipoPerfil.administrador))],
    db: DbSession,
) -> ProfessorListItem:
    u = user  # type: ignore[assignment]
    return _svc(db).patch_professor(u.instituicao_id, prof_id, body)  # type: ignore[attr-defined]


@router.delete("/cadastros/professores/{prof_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_professor(
    prof_id: uuid.UUID,
    user: Annotated[object, Depends(require_perfis(TipoPerfil.administrador))],
    db: DbSession,
) -> Response:
    u = user  # type: ignore[assignment]
    _svc(db).delete_professor(u.instituicao_id, prof_id)  # type: ignore[attr-defined]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/cadastros/alunos", response_model=list[AlunoListItem])
def list_alunos_cadastro(user: CadastroGestaoUser, db: DbSession) -> list[AlunoListItem]:
    return _svc(db).list_alunos_scoped(user)


@router.post("/cadastros/alunos", response_model=AlunoListItem, status_code=201)
def create_aluno(body: AlunoCreate, user: CadastroGestaoUser, db: DbSession) -> AlunoListItem:
    return _svc(db).create_aluno_scoped(user, body)


@router.get("/cadastros/alunos/{aluno_id}", response_model=AlunoListItem)
def get_aluno_cadastro(
    aluno_id: uuid.UUID, user: CadastroGestaoUser, db: DbSession
) -> AlunoListItem:
    return _svc(db).get_aluno_scoped_cadastro(user, aluno_id)


@router.patch("/cadastros/alunos/{aluno_id}", response_model=AlunoListItem)
def patch_aluno_cadastro(
    aluno_id: uuid.UUID, body: AlunoPatch, user: CadastroGestaoUser, db: DbSession
) -> AlunoListItem:
    return _svc(db).patch_aluno_scoped(user, aluno_id, body)


@router.get("/cadastros/responsaveis", response_model=list[ResponsavelListItem])
def list_responsaveis(user: CadastroGestaoUser, db: DbSession) -> list[ResponsavelListItem]:
    return _svc(db).list_responsaveis_scoped(user)


@router.post("/cadastros/responsaveis", response_model=ResponsavelListItem, status_code=201)
def create_responsavel(
    body: ResponsavelCreate, user: CadastroGestaoUser, db: DbSession
) -> ResponsavelListItem:
    return _svc(db).create_responsavel_scoped(user, body)


@router.get("/cadastros/responsaveis/{resp_id}", response_model=ResponsavelListItem)
def get_responsavel_cadastro(
    resp_id: uuid.UUID, user: CadastroGestaoUser, db: DbSession
) -> ResponsavelListItem:
    return _svc(db).get_responsavel_scoped(user, resp_id)


@router.post("/cadastros/alunos/{aluno_id}/responsaveis", status_code=201)
def vincular_responsavel(
    aluno_id: uuid.UUID,
    body: VinculoResponsavelCreate,
    user: CadastroGestaoUser,
    db: DbSession,
) -> dict[str, str]:
    _svc(db).vincular_responsavel_scoped(user, aluno_id, body)
    return {"status": "ok"}


@router.delete(
    "/cadastros/alunos/{aluno_id}/responsaveis/{responsavel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def desvincular_responsavel(
    aluno_id: uuid.UUID,
    responsavel_id: uuid.UUID,
    user: CadastroGestaoUser,
    db: DbSession,
) -> Response:
    _svc(db).desvincular_responsavel_scoped(user, aluno_id, responsavel_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/cadastros/turmas", response_model=list[TurmaListItem])
def list_turmas_cadastro(user: CadastroGestaoUser, db: DbSession) -> list[TurmaListItem]:
    if user.perfil == TipoPerfil.professor:
        return _svc(db).list_turmas(user, None)
    return _svc(db).list_turmas_cadastro(user.instituicao_id)  # type: ignore[arg-type]


@router.post("/cadastros/turmas", response_model=TurmaListItem, status_code=201)
def create_turma(body: TurmaCreate, user: CadastroGestaoUser, db: DbSession) -> TurmaListItem:
    return _svc(db).create_turma_scoped(user, body)


@router.get("/cadastros/turmas/{turma_id}", response_model=TurmaListItem)
def get_turma_cadastro(
    turma_id: uuid.UUID, user: CadastroGestaoUser, db: DbSession
) -> TurmaListItem:
    if user.perfil == TipoPerfil.administrador:
        return _svc(db).get_turma_cadastro(user.instituicao_id, turma_id)  # type: ignore[arg-type]
    return _svc(db).get_turma(user, turma_id)


@router.patch("/cadastros/turmas/{turma_id}", response_model=TurmaListItem)
def patch_turma_cadastro(
    turma_id: uuid.UUID, body: TurmaPatch, user: CadastroGestaoUser, db: DbSession
) -> TurmaListItem:
    return _svc(db).patch_turma_scoped(user, turma_id, body)


@router.post("/cadastros/matriculas", response_model=MatriculaResponse, status_code=201)
def create_matricula(
    body: MatriculaCreate, user: CadastroGestaoUser, db: DbSession
) -> MatriculaResponse:
    return _svc(db).create_matricula_scoped(user, body)


@router.patch("/cadastros/matriculas/{mat_id}", response_model=MatriculaResponse)
def patch_matricula(
    mat_id: uuid.UUID, body: MatriculaPatch, user: CadastroGestaoUser, db: DbSession
) -> MatriculaResponse:
    return _svc(db).patch_matricula_scoped(user, mat_id, body)


@router.get("/instituicoes/{inst_id}", response_model=InstituicaoResponse)
def get_instituicao(user: AuthUser, inst_id: uuid.UUID, db: DbSession) -> InstituicaoResponse:
    return _svc(db).get_instituicao_scoped(user, inst_id)


@router.patch("/instituicoes/{inst_id}", response_model=InstituicaoResponse)
def patch_instituicao(
    inst_id: uuid.UUID, body: InstituicaoPatch, user: AdminUser, db: DbSession
) -> InstituicaoResponse:
    return _svc(db).patch_instituicao_scoped(user, inst_id, body)


@router.get("/turmas", response_model=list[TurmaListItem])
def list_turmas(
    user: AuthUser,
    db: DbSession,
    nome: str | None = None,
) -> list[TurmaListItem]:
    return _svc(db).list_turmas(user, nome)


@router.get("/turmas/{turma_id}", response_model=TurmaListItem)
def get_turma(turma_id: uuid.UUID, user: AuthUser, db: DbSession) -> TurmaListItem:
    return _svc(db).get_turma(user, turma_id)


@router.get("/turmas/{turma_id}/alunos", response_model=list[AlunoListItem])
def list_turma_alunos(
    turma_id: uuid.UUID,
    user: Annotated[
        object,
        Depends(require_perfis(TipoPerfil.professor, TipoPerfil.responsavel)),
    ],
    db: DbSession,
) -> list[AlunoListItem]:
    return _svc(db).list_turma_alunos(user, turma_id)  # type: ignore[arg-type]


@router.get("/alunos/{aluno_id}", response_model=AlunoListItem)
def get_aluno(aluno_id: uuid.UUID, user: AuthUser, db: DbSession) -> AlunoListItem:
    return _svc(db).get_aluno_scoped(user, aluno_id)


@router.get("/alunos/{aluno_id}/responsaveis", response_model=list[ResponsavelVinculoItem])
def list_aluno_responsaveis(
    aluno_id: uuid.UUID,
    user: Annotated[
        object,
        Depends(require_perfis(TipoPerfil.professor, TipoPerfil.aluno)),
    ],
    db: DbSession,
) -> list[ResponsavelVinculoItem]:
    return _svc(db).list_aluno_responsaveis(user, aluno_id)  # type: ignore[arg-type]
