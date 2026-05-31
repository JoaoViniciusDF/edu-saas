from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, get_current_user_optional, require_perfis
from app.core.config import get_settings
from app.core.exceptions import not_found, unauthorized
from app.models.enums import TipoPerfil
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, UserMe, UserPreferencesPatch
from app.schemas.common import PaginatedResponse
from app.schemas.configuracoes import (
    AlunoDetalheResponse,
    AlunoListItem,
    AlunoPatch,
    DiretorioPlataformaResponse,
    InstituicaoCreate,
    InstituicaoPatch,
    InstituicaoResponse,
    InstituicaoResumoResponse,
    MatriculaCreate,
    MatriculaPatch,
    MatriculaResponse,
    ProfessorDetalheResponse,
    ProfessorListItem,
    ProfessorPatch,
    ResponsavelListItem,
    ResponsavelPatch,
    ResponsavelVinculoItem,
    SuperAdminResumo,
    TurmaCreate,
    TurmaListItem,
    TurmaPatch,
    UsuarioCreate,
    UsuarioCreateResponse,
    VinculoResponsavelCreate,
    VisaoPlataforma,
)
from app.services.configuracoes_service import ConfiguracoesService

router = APIRouter(prefix="/configuracoes", tags=["Configurações"])

AdminUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.administrador))]
SuperAdminUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.super_admin))]
CadastroGestaoUser = Annotated[
    CurrentUser,
    Depends(require_perfis(TipoPerfil.administrador, TipoPerfil.professor)),
]
CadastroLeituraUser = Annotated[
    CurrentUser,
    Depends(
        require_perfis(
            TipoPerfil.super_admin,
            TipoPerfil.administrador,
            TipoPerfil.professor,
            TipoPerfil.aluno,
            TipoPerfil.responsavel,
        )
    ),
]


def _svc(db: DbSession) -> ConfiguracoesService:
    return ConfiguracoesService(db)


@router.post("/autenticar", response_model=LoginResponse)
def autenticar(body: LoginRequest, db: DbSession) -> LoginResponse:
    return _svc(db).login(body)


@router.post("/renovar-token", response_model=LoginResponse)
def renovar_token(body: RefreshRequest, db: DbSession) -> LoginResponse:
    return _svc(db).refresh(body)


@router.post("/encerrar-sessao", status_code=status.HTTP_204_NO_CONTENT)
def encerrar_sessao(db: DbSession) -> Response:
    _svc(db).logout()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/consultar-perfil", response_model=UserMe)
def consultar_perfil(user: AuthUser, db: DbSession) -> UserMe:
    return _svc(db).me(user)


@router.put("/atualizar-preferencias", response_model=UserMe)
def atualizar_preferencias(
    body: UserPreferencesPatch, user: AuthUser, db: DbSession
) -> UserMe:
    return _svc(db).patch_preferences(user, body)


@router.post("/criar-usuario", response_model=UsuarioCreateResponse, status_code=201)
def criar_usuario(
    body: UsuarioCreate,
    db: DbSession,
    user: Annotated[CurrentUser | None, Depends(get_current_user_optional)] = None,
) -> UsuarioCreateResponse:
    if get_settings().app_env != "development":
        if user is None or user.perfil not in (
            TipoPerfil.super_admin,
            TipoPerfil.administrador,
            TipoPerfil.professor,
        ):
            raise unauthorized("Autenticação necessária para criar usuários")
    return _svc(db).create_usuario(body, actor=user)


@router.get("/consultar-instituicoes", response_model=PaginatedResponse[InstituicaoResponse])
def consultar_instituicoes(
    db: DbSession,
    _: SuperAdminUser,
    cursor: str | None = None,
    limit: int = 50,
) -> PaginatedResponse[InstituicaoResponse]:
    return _svc(db).list_instituicoes(cursor, limit)


@router.post("/criar-instituicao", response_model=InstituicaoResponse, status_code=201)
def criar_instituicao(body: InstituicaoCreate, db: DbSession, _: SuperAdminUser) -> InstituicaoResponse:
    return _svc(db).create_instituicao(body)


@router.get("/consultar-instituicao/{inst_id}", response_model=InstituicaoResponse)
def consultar_instituicao(
    inst_id: uuid.UUID,
    user: Annotated[
        CurrentUser,
        Depends(require_perfis(TipoPerfil.super_admin, TipoPerfil.administrador)),
    ],
    db: DbSession,
) -> InstituicaoResponse:
    return _svc(db).get_instituicao_scoped(user, inst_id)


@router.put("/editar-instituicao/{inst_id}", response_model=InstituicaoResponse)
def editar_instituicao(
    inst_id: uuid.UUID,
    body: InstituicaoPatch,
    user: Annotated[
        CurrentUser,
        Depends(require_perfis(TipoPerfil.super_admin, TipoPerfil.administrador)),
    ],
    db: DbSession,
) -> InstituicaoResponse:
    if user.perfil == TipoPerfil.super_admin:
        return _svc(db).patch_instituicao(inst_id, body)
    return _svc(db).patch_instituicao_scoped(user, inst_id, body)


@router.get("/consultar-resumo-plataforma", response_model=SuperAdminResumo)
def consultar_resumo_plataforma(db: DbSession, _: SuperAdminUser) -> SuperAdminResumo:
    return _svc(db).super_admin_resumo()


@router.get("/consultar-resumo-instituicao/{inst_id}", response_model=InstituicaoResumoResponse)
def consultar_resumo_instituicao(
    inst_id: uuid.UUID, db: DbSession, _: SuperAdminUser
) -> InstituicaoResumoResponse:
    return _svc(db).resumo_instituicao(inst_id)


@router.get("/consultar-diretorio-plataforma", response_model=DiretorioPlataformaResponse)
def consultar_diretorio_plataforma(
    db: DbSession,
    _: SuperAdminUser,
    visao: VisaoPlataforma,
    instituicao_id: uuid.UUID | None = None,
    turma_ids: list[uuid.UUID] | None = None,
    perfil: TipoPerfil | None = None,
    busca: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> DiretorioPlataformaResponse:
    return _svc(db).consultar_diretorio_plataforma(
        visao,
        instituicao_id=instituicao_id,
        turma_ids=turma_ids,
        perfil=perfil,
        busca=busca,
        limit=limit,
        offset=offset,
    )


@router.get("/consultar-detalhe-aluno/{aluno_id}", response_model=AlunoDetalheResponse)
def consultar_detalhe_aluno(
    aluno_id: uuid.UUID, db: DbSession, _: SuperAdminUser
) -> AlunoDetalheResponse:
    return _svc(db).detalhe_aluno_super(aluno_id)


@router.get("/consultar-detalhe-professor/{prof_id}", response_model=ProfessorDetalheResponse)
def consultar_detalhe_professor(
    prof_id: uuid.UUID, db: DbSession, _: SuperAdminUser
) -> ProfessorDetalheResponse:
    return _svc(db).detalhe_professor_super(prof_id)


@router.post("/assumir-sessao/{usuario_id}", response_model=LoginResponse)
def assumir_sessao(
    usuario_id: uuid.UUID, user: SuperAdminUser, db: DbSession
) -> LoginResponse:
    return _svc(db).assumir_sessao(user, usuario_id)


@router.post("/restaurar-sessao-admin", response_model=LoginResponse)
def restaurar_sessao_admin(body: RefreshRequest, db: DbSession) -> LoginResponse:
    return _svc(db).restaurar_sessao_admin(body.refresh_token)


@router.get("/consultar-minha-instituicao", response_model=InstituicaoResponse)
def consultar_minha_instituicao(user: AuthUser, db: DbSession) -> InstituicaoResponse:
    return _svc(db).get_minha_instituicao(user)


@router.get("/consultar-professores", response_model=list[ProfessorListItem])
def consultar_professores(
    user: Annotated[
        CurrentUser,
        Depends(require_perfis(TipoPerfil.super_admin, TipoPerfil.administrador)),
    ],
    db: DbSession,
    instituicao_id: uuid.UUID | None = None,
) -> list[ProfessorListItem]:
    svc = _svc(db)
    if user.perfil == TipoPerfil.super_admin:
        return svc.super_admin_professores(instituicao_id)
    return svc.list_professores(user.instituicao_id)  # type: ignore[arg-type]


@router.get("/consultar-professor/{prof_id}", response_model=ProfessorListItem)
def consultar_professor(
    prof_id: uuid.UUID,
    user: Annotated[
        CurrentUser,
        Depends(require_perfis(TipoPerfil.super_admin, TipoPerfil.administrador)),
    ],
    db: DbSession,
) -> ProfessorListItem:
    svc = _svc(db)
    if user.perfil == TipoPerfil.super_admin:
        rows = svc.super_admin_professores()
        for p in rows:
            if p.id == prof_id:
                return p
        raise not_found()
    return svc.get_professor(user.instituicao_id, prof_id)  # type: ignore[arg-type]


@router.put("/editar-professor/{prof_id}", response_model=ProfessorListItem)
def editar_professor(
    prof_id: uuid.UUID, body: ProfessorPatch, user: AdminUser, db: DbSession
) -> ProfessorListItem:
    return _svc(db).patch_professor(user.instituicao_id, prof_id, body)  # type: ignore[arg-type]


@router.delete("/desativar-professor/{prof_id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_professor(prof_id: uuid.UUID, user: AdminUser, db: DbSession) -> Response:
    _svc(db).delete_professor(user.instituicao_id, prof_id)  # type: ignore[arg-type]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/consultar-alunos", response_model=list[AlunoListItem])
def consultar_alunos(
    user: CadastroLeituraUser,
    db: DbSession,
    instituicao_id: uuid.UUID | None = None,
) -> list[AlunoListItem]:
    return _svc(db).list_alunos_unified(user, instituicao_id)


@router.get("/consultar-aluno/{aluno_id}", response_model=AlunoListItem)
def consultar_aluno(
    aluno_id: uuid.UUID, user: CadastroLeituraUser, db: DbSession
) -> AlunoListItem:
    return _svc(db).get_aluno_scoped(user, aluno_id)


@router.put("/editar-aluno/{aluno_id}", response_model=AlunoListItem)
def editar_aluno(
    aluno_id: uuid.UUID, body: AlunoPatch, user: CadastroGestaoUser, db: DbSession
) -> AlunoListItem:
    return _svc(db).patch_aluno_scoped(user, aluno_id, body)


@router.delete("/apagar-aluno/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_aluno(aluno_id: uuid.UUID, user: AdminUser, db: DbSession) -> Response:
    _svc(db).delete_aluno_scoped(user, aluno_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/consultar-turmas", response_model=list[TurmaListItem])
def consultar_turmas(
    user: CadastroLeituraUser,
    db: DbSession,
    nome: str | None = None,
    instituicao_id: uuid.UUID | None = None,
) -> list[TurmaListItem]:
    return _svc(db).list_turmas(user, nome, instituicao_id)


@router.post("/criar-turma", response_model=TurmaListItem, status_code=201)
def criar_turma(body: TurmaCreate, user: CadastroGestaoUser, db: DbSession) -> TurmaListItem:
    return _svc(db).create_turma_scoped(user, body)


@router.get("/consultar-turma/{turma_id}", response_model=TurmaListItem)
def consultar_turma(
    turma_id: uuid.UUID, user: CadastroLeituraUser, db: DbSession
) -> TurmaListItem:
    return _svc(db).get_turma(user, turma_id)


@router.put("/editar-turma/{turma_id}", response_model=TurmaListItem)
def editar_turma(
    turma_id: uuid.UUID, body: TurmaPatch, user: CadastroGestaoUser, db: DbSession
) -> TurmaListItem:
    return _svc(db).patch_turma_scoped(user, turma_id, body)


@router.get("/consultar-alunos-turma/{turma_id}", response_model=list[AlunoListItem])
def consultar_alunos_turma(
    turma_id: uuid.UUID,
    user: Annotated[
        CurrentUser,
        Depends(
            require_perfis(
                TipoPerfil.administrador,
                TipoPerfil.professor,
                TipoPerfil.responsavel,
            )
        ),
    ],
    db: DbSession,
) -> list[AlunoListItem]:
    return _svc(db).list_turma_alunos(user, turma_id)


@router.post("/criar-matricula", response_model=MatriculaResponse, status_code=201)
def criar_matricula(
    body: MatriculaCreate, user: CadastroGestaoUser, db: DbSession
) -> MatriculaResponse:
    return _svc(db).create_matricula_scoped(user, body)


@router.put("/editar-matricula/{mat_id}", response_model=MatriculaResponse)
def editar_matricula(
    mat_id: uuid.UUID, body: MatriculaPatch, user: CadastroGestaoUser, db: DbSession
) -> MatriculaResponse:
    return _svc(db).patch_matricula_scoped(user, mat_id, body)


@router.get("/consultar-responsaveis", response_model=list[ResponsavelListItem])
def consultar_responsaveis(user: CadastroGestaoUser, db: DbSession) -> list[ResponsavelListItem]:
    return _svc(db).list_responsaveis_scoped(user)


@router.get("/consultar-responsavel/{resp_id}", response_model=ResponsavelListItem)
def consultar_responsavel(
    resp_id: uuid.UUID, user: CadastroGestaoUser, db: DbSession
) -> ResponsavelListItem:
    return _svc(db).get_responsavel_scoped(user, resp_id)


@router.put("/editar-responsavel/{resp_id}", response_model=ResponsavelListItem)
def editar_responsavel(
    resp_id: uuid.UUID, body: ResponsavelPatch, user: CadastroGestaoUser, db: DbSession
) -> ResponsavelListItem:
    return _svc(db).patch_responsavel_scoped(user, resp_id, body)


@router.get(
    "/consultar-responsaveis-aluno/{aluno_id}",
    response_model=list[ResponsavelVinculoItem],
)
def consultar_responsaveis_aluno(
    aluno_id: uuid.UUID,
    user: Annotated[
        CurrentUser,
        Depends(
            require_perfis(
                TipoPerfil.super_admin,
                TipoPerfil.administrador,
                TipoPerfil.professor,
                TipoPerfil.aluno,
            )
        ),
    ],
    db: DbSession,
) -> list[ResponsavelVinculoItem]:
    return _svc(db).list_aluno_responsaveis(user, aluno_id)


@router.post("/vincular-responsavel-aluno/{aluno_id}", status_code=201)
def vincular_responsavel_aluno(
    aluno_id: uuid.UUID,
    body: VinculoResponsavelCreate,
    user: CadastroGestaoUser,
    db: DbSession,
) -> dict[str, str]:
    _svc(db).vincular_responsavel_scoped(user, aluno_id, body)
    return {"status": "ok"}


@router.delete(
    "/desvincular-responsavel-aluno/{aluno_id}/{responsavel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def desvincular_responsavel_aluno(
    aluno_id: uuid.UUID,
    responsavel_id: uuid.UUID,
    user: CadastroGestaoUser,
    db: DbSession,
) -> Response:
    _svc(db).desvincular_responsavel_scoped(user, aluno_id, responsavel_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
