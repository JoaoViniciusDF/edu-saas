import { bffRequest } from "../client"
import type {
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
} from "../dtos/avaliacoes"

export const avaliacoesRequests = {
  listMaterias: () => bffRequest<MateriaResponse[]>("/avaliacoes/materias"),
  createMateria: (body: MateriaCreate) =>
    bffRequest<MateriaResponse>("/avaliacoes/materias", { method: "POST", body }),
  patchMateria: (id: string, body: MateriaPatch) =>
    bffRequest<MateriaResponse>(`/avaliacoes/materias/${id}`, { method: "PATCH", body }),
  deleteMateria: (id: string) =>
    bffRequest<void>(`/avaliacoes/materias/${id}`, { method: "DELETE" }),
  getArvore: (materiaId: string) =>
    bffRequest<ArvoreMateria>(`/avaliacoes/materias/${materiaId}/arvore`),
  createAssunto: (materiaId: string, body: AssuntoCreate) =>
    bffRequest<AssuntoResponse>(`/avaliacoes/materias/${materiaId}/assuntos`, {
      method: "POST",
      body,
    }),
  patchAssunto: (id: string, body: AssuntoPatch) =>
    bffRequest<AssuntoResponse>(`/avaliacoes/assuntos/${id}`, { method: "PATCH", body }),
  deleteAssunto: (id: string) =>
    bffRequest<void>(`/avaliacoes/assuntos/${id}`, { method: "DELETE" }),
  createPasta: (assuntoId: string, body: PastaCreate) =>
    bffRequest<PastaResponse>(`/avaliacoes/assuntos/${assuntoId}/pastas`, {
      method: "POST",
      body,
    }),
  getPasta: (id: string) => bffRequest<PastaResponse>(`/avaliacoes/pastas/${id}`),
  patchPasta: (id: string, body: PastaPatch) =>
    bffRequest<PastaResponse>(`/avaliacoes/pastas/${id}`, { method: "PATCH", body }),
  listAvaliacoesPasta: (pastaId: string) =>
    bffRequest<AvaliacaoListItem[]>(`/avaliacoes/pastas/${pastaId}/avaliacoes`),
  createAvaliacao: (pastaId: string, body: AvaliacaoCreate) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/pastas/${pastaId}/avaliacoes`, {
      method: "POST",
      body,
    }),
  getAvaliacao: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}`),
  patchAvaliacao: (id: string, body: AvaliacaoPatch) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}`, { method: "PATCH", body }),
  salvarRascunho: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}/salvar-rascunho`, {
      method: "POST",
    }),
  publicar: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}/publicar`, { method: "POST" }),
  encerrar: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}/encerrar`, { method: "POST" }),
  replaceQuestoes: (id: string, body: QuestoesBulkReplace) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}/questoes`, {
      method: "PUT",
      body,
    }),
  addQuestao: (id: string, body: QuestaoUpsert) =>
    bffRequest<QuestaoResponse>(`/avaliacoes/avaliacoes/${id}/questoes`, {
      method: "POST",
      body,
    }),
  reordenarQuestoes: (id: string, body: QuestoesReorder) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/avaliacoes/${id}/questoes/reordenar`, {
      method: "POST",
      body,
    }),
  patchQuestao: (avaliacaoId: string, questaoId: string, body: QuestaoUpsert) =>
    bffRequest<QuestaoResponse>(
      `/avaliacoes/avaliacoes/${avaliacaoId}/questoes/${questaoId}`,
      { method: "PATCH", body }
    ),
  deleteQuestao: (avaliacaoId: string, questaoId: string) =>
    bffRequest<void>(`/avaliacoes/avaliacoes/${avaliacaoId}/questoes/${questaoId}`, {
      method: "DELETE",
    }),
}

export const alunoAvaliacoesRequests = {
  disponiveis: () => bffRequest<AlunoAvaliacaoDisponivel[]>("/aluno/avaliacoes/disponiveis"),
  getView: (id: string) => bffRequest<AlunoAvaliacaoView>(`/aluno/avaliacoes/${id}`),
  createSubmissao: (avaliacaoId: string) =>
    bffRequest<SubmissaoResponse>(`/aluno/avaliacoes/${avaliacaoId}/submissoes`, {
      method: "POST",
    }),
  patchSubmissao: (id: string, body: SubmissaoPatch) =>
    bffRequest<SubmissaoResponse>(`/aluno/submissoes/${id}`, { method: "PATCH", body }),
  enviarSubmissao: (id: string) =>
    bffRequest<SubmissaoResponse>(`/aluno/submissoes/${id}/enviar`, { method: "POST" }),
}
