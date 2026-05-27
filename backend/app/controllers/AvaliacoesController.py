from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import AuthUser, CurrentUser, DbSession, require_perfis
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

router = APIRouter(tags=["Avaliações"])

DocenteUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.professor, TipoPerfil.administrador))]
AlunoUser = Annotated[CurrentUser, Depends(require_perfis(TipoPerfil.aluno))]


def _svc(db: DbSession) -> AvaliacoesService:
    return AvaliacoesService(db)


@router.get("/avaliacoes/materias", response_model=list[MateriaResponse])
def list_materias(user: DocenteUser, db: DbSession) -> list[MateriaResponse]:
    return _svc(db).list_materias(user)


@router.post("/avaliacoes/materias", response_model=MateriaResponse, status_code=201)
def create_materia(body: MateriaCreate, user: DocenteUser, db: DbSession) -> MateriaResponse:
    return _svc(db).create_materia(user, body)


@router.patch("/avaliacoes/materias/{materia_id}", response_model=MateriaResponse)
def patch_materia(
    materia_id: uuid.UUID, body: MateriaPatch, user: DocenteUser, db: DbSession
) -> MateriaResponse:
    return _svc(db).patch_materia(user, materia_id, body)


@router.delete("/avaliacoes/materias/{materia_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_materia(materia_id: uuid.UUID, user: DocenteUser, db: DbSession) -> Response:
    _svc(db).delete_materia(user, materia_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/avaliacoes/materias/{materia_id}/arvore", response_model=ArvoreMateria)
def get_arvore(materia_id: uuid.UUID, user: DocenteUser, db: DbSession) -> ArvoreMateria:
    return _svc(db).get_arvore(user, materia_id)


@router.post("/avaliacoes/materias/{materia_id}/assuntos", response_model=AssuntoResponse, status_code=201)
def create_assunto(
    materia_id: uuid.UUID, body: AssuntoCreate, user: DocenteUser, db: DbSession
) -> AssuntoResponse:
    return _svc(db).create_assunto(user, materia_id, body)


@router.patch("/avaliacoes/assuntos/{assunto_id}", response_model=AssuntoResponse)
def patch_assunto(
    assunto_id: uuid.UUID, body: AssuntoPatch, user: DocenteUser, db: DbSession
) -> AssuntoResponse:
    return _svc(db).patch_assunto(user, assunto_id, body)


@router.delete("/avaliacoes/assuntos/{assunto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assunto(assunto_id: uuid.UUID, user: DocenteUser, db: DbSession) -> Response:
    _svc(db).delete_assunto(user, assunto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/avaliacoes/assuntos/{assunto_id}/pastas", response_model=PastaResponse, status_code=201)
def create_pasta(
    assunto_id: uuid.UUID, body: PastaCreate, user: DocenteUser, db: DbSession
) -> PastaResponse:
    return _svc(db).create_pasta(user, assunto_id, body)


@router.get("/avaliacoes/pastas/{pasta_id}", response_model=PastaResponse)
def get_pasta(pasta_id: uuid.UUID, user: DocenteUser, db: DbSession) -> PastaResponse:
    return _svc(db).get_pasta(user, pasta_id)


@router.patch("/avaliacoes/pastas/{pasta_id}", response_model=PastaResponse)
def patch_pasta(
    pasta_id: uuid.UUID, body: PastaPatch, user: DocenteUser, db: DbSession
) -> PastaResponse:
    return _svc(db).patch_pasta(user, pasta_id, body)


@router.get("/avaliacoes/pastas/{pasta_id}/avaliacoes", response_model=list[AvaliacaoListItem])
def list_avaliacoes_pasta(
    pasta_id: uuid.UUID, user: DocenteUser, db: DbSession
) -> list[AvaliacaoListItem]:
    return _svc(db).list_avaliacoes_pasta(user, pasta_id)


@router.post("/avaliacoes/pastas/{pasta_id}/avaliacoes", response_model=AvaliacaoDetail, status_code=201)
def create_avaliacao(
    pasta_id: uuid.UUID, body: AvaliacaoCreate, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).create_avaliacao(user, pasta_id, body)


@router.get("/avaliacoes/avaliacoes/{avaliacao_id}", response_model=AvaliacaoDetail)
def get_avaliacao(avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession) -> AvaliacaoDetail:
    return _svc(db).get_avaliacao(user, avaliacao_id)


@router.patch("/avaliacoes/avaliacoes/{avaliacao_id}", response_model=AvaliacaoDetail)
def patch_avaliacao(
    avaliacao_id: uuid.UUID, body: AvaliacaoPatch, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).patch_avaliacao(user, avaliacao_id, body)


@router.post("/avaliacoes/avaliacoes/{avaliacao_id}/salvar-rascunho", response_model=AvaliacaoDetail)
def salvar_rascunho(avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession) -> AvaliacaoDetail:
    return _svc(db).salvar_rascunho(user, avaliacao_id)


@router.post("/avaliacoes/avaliacoes/{avaliacao_id}/publicar", response_model=AvaliacaoDetail)
def publicar_avaliacao(avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession) -> AvaliacaoDetail:
    return _svc(db).publicar(user, avaliacao_id)


@router.post("/avaliacoes/avaliacoes/{avaliacao_id}/encerrar", response_model=AvaliacaoDetail)
def encerrar_avaliacao(avaliacao_id: uuid.UUID, user: DocenteUser, db: DbSession) -> AvaliacaoDetail:
    return _svc(db).encerrar(user, avaliacao_id)


@router.put("/avaliacoes/avaliacoes/{avaliacao_id}/questoes", response_model=AvaliacaoDetail)
def replace_questoes(
    avaliacao_id: uuid.UUID, body: QuestoesBulkReplace, user: DocenteUser, db: DbSession
) -> AvaliacaoDetail:
    return _svc(db).replace_questoes(user, avaliacao_id, body)


@router.post("/avaliacoes/avaliacoes/{avaliacao_id}/questoes", response_model=QuestaoResponse, status_code=201)
def add_questao(
    avaliacao_id: uuid.UUID, body: QuestaoUpsert, user: DocenteUser, db: DbSession
) -> QuestaoResponse:
    return _svc(db).add_questao(user, avaliacao_id, body)


@router.patch("/avaliacoes/avaliacoes/{avaliacao_id}/questoes/{qid}", response_model=QuestaoResponse)
def patch_questao(
    avaliacao_id: uuid.UUID,
    qid: uuid.UUID,
    body: QuestaoUpsert,
    user: DocenteUser,
    db: DbSession,
) -> QuestaoResponse:
    return _svc(db).patch_questao(user, avaliacao_id, qid, body)


@router.delete(
    "/avaliacoes/avaliacoes/{avaliacao_id}/questoes/{qid}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_questao(
    avaliacao_id: uuid.UUID, qid: uuid.UUID, user: DocenteUser, db: DbSession
) -> Response:
    _svc(db).delete_questao(user, avaliacao_id, qid)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/avaliacoes/avaliacoes/{avaliacao_id}/questoes/reordenar", response_model=AvaliacaoDetail)
def reordenar_questoes(
    avaliacao_id: uuid.UUID,
    body: QuestoesReorder,
    user: DocenteUser,
    db: DbSession,
) -> AvaliacaoDetail:
    ordens = [{"id": str(o.id), "ordem": o.ordem} for o in body.ordens]
    return _svc(db).reordenar_questoes(user, avaliacao_id, ordens)


@router.get("/aluno/avaliacoes/disponiveis", response_model=list[AlunoAvaliacaoDisponivel])
def aluno_disponiveis(user: AlunoUser, db: DbSession) -> list[AlunoAvaliacaoDisponivel]:
    return _svc(db).aluno_disponiveis(user)


@router.get("/aluno/avaliacoes/{avaliacao_id}", response_model=AlunoAvaliacaoView)
def aluno_get_avaliacao(avaliacao_id: uuid.UUID, user: AlunoUser, db: DbSession) -> AlunoAvaliacaoView:
    return _svc(db).aluno_get_avaliacao(user, avaliacao_id)


@router.post("/aluno/avaliacoes/{avaliacao_id}/submissoes", response_model=SubmissaoResponse, status_code=201)
def aluno_create_submissao(
    avaliacao_id: uuid.UUID, user: AlunoUser, db: DbSession
) -> SubmissaoResponse:
    return _svc(db).aluno_create_submissao(user, avaliacao_id)


@router.patch("/aluno/submissoes/{submissao_id}", response_model=SubmissaoResponse)
def aluno_patch_submissao(
    submissao_id: uuid.UUID, body: SubmissaoPatch, user: AlunoUser, db: DbSession
) -> SubmissaoResponse:
    return _svc(db).aluno_patch_submissao(user, submissao_id, body)


@router.post("/aluno/submissoes/{submissao_id}/enviar", response_model=SubmissaoResponse)
def aluno_enviar_submissao(
    submissao_id: uuid.UUID, user: AlunoUser, db: DbSession
) -> SubmissaoResponse:
    return _svc(db).aluno_enviar_submissao(user, submissao_id)
