from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import CurrentUser, DbSession, require_perfis
from app.models.enums import TipoPerfil
from app.schemas.avaliacoes import (
    AlunoAvaliacaoDisponivel,
    AlunoAvaliacaoView,
    ArvoreMateria,
    AssuntoCreate,
    AssuntoPatch,
    AssuntoResponse,
    AvaliacaoCreate,
    AvaliacaoDetail,
    AvaliacaoListItem,
    AvaliacaoPatch,
    MateriaCreate,
    MateriaPatch,
    MateriaResponse,
    PastaCreate,
    PastaPatch,
    PastaResponse,
    QuestaoResponse,
    QuestaoUpsert,
    QuestoesBulkReplace,
    QuestoesReorder,
    SubmissaoPatch,
    SubmissaoResponse,
)
from app.services.avaliacoes_service import AvaliacoesService

router = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])

DocenteUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.professor, TipoPerfil.administrador))]
AlunoUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.aluno))]


def _svc(db: DbSession) -> AvaliacoesService:
    return AvaliacoesService(db)


@router.get("/consultar-materias", response_model=list[MateriaResponse])
def consultar_materias(user: DocenteUser, db: DbSession) -> list[MateriaResponse]:
    return _svc(db).list_materias(user)


@router.post("/criar-materia", response_model=MateriaResponse, status_code=201)
def criar_materia(body: MateriaCreate, user: DocenteUser, db: DbSession) -> MateriaResponse:
    return _svc(db).create_materia(user, body)


@router.put("/editar-materia/{materia_id}", response_model=MateriaResponse)
def editar_materia(
    materia_id: uuid.UUID, body: MateriaPatch, user: DocenteUser, db: DbSession
) -> MateriaResponse:
    return _svc(db).patch_materia(user, materia_id, body)


@router.delete("/apagar-materia/{materia_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_materia(materia_id: uuid.UUID, user: DocenteUser, db: DbSession) -> Response:
    _svc(db).delete_materia(user, materia_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/consultar-arvore-materia/{materia_id}", response_model=ArvoreMateria)
def consultar_arvore_materia(
    materia_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> ArvoreMateria:
    return _svc(db).get_arvore(user, materia_id)


@router.post("/criar-assunto/{materia_id}", response_model=AssuntoResponse, status_code=201)
def criar_assunto(
    materia_id: uuid.UUID, body: AssuntoCreate, user: DocenteUser, db: DbSession
) -> AssuntoResponse:
    return _svc(db).create_assunto(user, materia_id, body)


@router.put("/editar-assunto/{assunto_id}", response_model=AssuntoResponse)
def editar_assunto(
    assunto_id: uuid.UUID, body: AssuntoPatch, user: DocenteUser, db: DbSession
) -> AssuntoResponse:
    return _svc(db).patch_assunto(user, assunto_id, body)


@router.delete("/apagar-assunto/{assunto_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_assunto(assunto_id: uuid.UUID, user: DocenteUser, db: DbSession) -> Response:
    _svc(db).delete_assunto(user, assunto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/consultar-pasta/{pasta_id}", response_model=PastaResponse)
def consultar_pasta(pasta_id: uuid.UUID, user: DocenteUser, db: DbSession) -> PastaResponse:
    return _svc(db).get_pasta(user, pasta_id)


@router.post("/criar-pasta/{assunto_id}", response_model=PastaResponse, status_code=201)
def criar_pasta(
    assunto_id: uuid.UUID, body: PastaCreate, user: DocenteUser, db: DbSession
) -> PastaResponse:
    return _svc(db).create_pasta(user, assunto_id, body)


@router.put("/editar-pasta/{pasta_id}", response_model=PastaResponse)
def editar_pasta(
    pasta_id: uuid.UUID, body: PastaPatch, user: DocenteUser, db: DbSession
) -> PastaResponse:
    return _svc(db).patch_pasta(user, pasta_id, body)


@router.get("/consultar-avaliacoes-pasta/{pasta_id}", response_model=list[AvaliacaoListItem])
def consultar_avaliacoes_pasta(
    pasta_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> list[AvaliacaoListItem]:
    return _svc(db).list_avaliacoes_pasta(user, pasta_id)


@router.post("/criar-avaliacao/{pasta_id}", response_model=AvaliacaoDetail, status_code=201)
def criar_avaliacao(
    pasta_id: uuid.UUID, body: AvaliacaoCreate, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).create_avaliacao(user, pasta_id, body)


@router.get("/consultar-avaliacao/{avaliacao_id}", response_model=AvaliacaoDetail)
def consultar_avaliacao(
    avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).get_avaliacao(user, avaliacao_id)


@router.put("/editar-avaliacao/{avaliacao_id}", response_model=AvaliacaoDetail)
def editar_avaliacao(
    avaliacao_id: uuid.UUID, body: AvaliacaoPatch, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).patch_avaliacao(user, avaliacao_id, body)


@router.post("/salvar-rascunho-avaliacao/{avaliacao_id}", response_model=AvaliacaoDetail)
def salvar_rascunho_avaliacao(
    avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).salvar_rascunho(user, avaliacao_id)


@router.post("/publicar-avaliacao/{avaliacao_id}", response_model=AvaliacaoDetail)
def publicar_avaliacao(
    avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).publicar(user, avaliacao_id)


@router.post("/encerrar-avaliacao/{avaliacao_id}", response_model=AvaliacaoDetail)
def encerrar_avaliacao(
    avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).encerrar(user, avaliacao_id)


@router.put("/substituir-questoes-avaliacao/{avaliacao_id}", response_model=AvaliacaoDetail)
def substituir_questoes_avaliacao(
    avaliacao_id: uuid.UUID, body: QuestoesBulkReplace, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).replace_questoes(user, avaliacao_id, body)


@router.post("/criar-questao/{avaliacao_id}", response_model=QuestaoResponse, status_code=201)
def criar_questao(
    avaliacao_id: uuid.UUID, body: QuestaoUpsert, user: DocenteUser, db: DbSession
) -> QuestaoResponse:
    return _svc(db).add_questao(user, avaliacao_id, body)


@router.put("/editar-questao/{avaliacao_id}/{questao_id}", response_model=QuestaoResponse)
def editar_questao(
    avaliacao_id: uuid.UUID,
    questao_id: uuid.UUID,
    body: QuestaoUpsert,
    user: DocenteUser,
    db: DbSession,
) -> QuestaoResponse:
    return _svc(db).patch_questao(user, avaliacao_id, questao_id, body)


@router.delete(
    "/apagar-questao/{avaliacao_id}/{questao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def apagar_questao(
    avaliacao_id: uuid.UUID, questao_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> Response:
    _svc(db).delete_questao(user, avaliacao_id, questao_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reordenar-questoes/{avaliacao_id}", response_model=AvaliacaoDetail)
def reordenar_questoes(
    avaliacao_id: uuid.UUID,
    body: QuestoesReorder,
    user: DocenteUser,
    db: DbSession,
) -> AvaliacaoDetail:
    ordens = [{"id": str(o.id), "ordem": o.ordem} for o in body.ordens]
    return _svc(db).reordenar_questoes(user, avaliacao_id, ordens)


@router.get("/consultar-disponiveis", response_model=list[AlunoAvaliacaoDisponivel])
def consultar_disponiveis(user: AlunoUser, db: DbSession) -> list[AlunoAvaliacaoDisponivel]:
    return _svc(db).aluno_disponiveis(user)


@router.get("/consultar-avaliacao-resolver/{avaliacao_id}", response_model=AlunoAvaliacaoView)
def consultar_avaliacao_resolver(
    avaliacao_id: uuid.UUID, user: AlunoUser, db: DbSession
) -> AlunoAvaliacaoView:
    return _svc(db).aluno_get_avaliacao(user, avaliacao_id)


@router.post("/iniciar-submissao/{avaliacao_id}", response_model=SubmissaoResponse, status_code=201)
def iniciar_submissao(
    avaliacao_id: uuid.UUID, user: AlunoUser, db: DbSession
) -> SubmissaoResponse:
    return _svc(db).aluno_create_submissao(user, avaliacao_id)


@router.put("/atualizar-submissao/{submissao_id}", response_model=SubmissaoResponse)
def atualizar_submissao(
    submissao_id: uuid.UUID, body: SubmissaoPatch, user: AlunoUser, db: DbSession
) -> SubmissaoResponse:
    return _svc(db).aluno_patch_submissao(user, submissao_id, body)


@router.post("/enviar-submissao/{submissao_id}", response_model=SubmissaoResponse)
def enviar_submissao(
    submissao_id: uuid.UUID, user: AlunoUser, db: DbSession
) -> SubmissaoResponse:
    return _svc(db).aluno_enviar_submissao(user, submissao_id)
