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
  listMaterias: () => bffRequest<MateriaResponse[]>("/avaliacoes/consultar-materias"),
  createMateria: (body: MateriaCreate) =>
    bffRequest<MateriaResponse>("/avaliacoes/criar-materia", { method: "POST", body }),
  patchMateria: (id: string, body: MateriaPatch) =>
    bffRequest<MateriaResponse>(`/avaliacoes/editar-materia/${id}`, { method: "PUT", body }),
  deleteMateria: (id: string) =>
    bffRequest<void>(`/avaliacoes/apagar-materia/${id}`, { method: "DELETE" }),
  getArvore: (materiaId: string) =>
    bffRequest<ArvoreMateria>(`/avaliacoes/consultar-arvore-materia/${materiaId}`),
  createAssunto: (materiaId: string, body: AssuntoCreate) =>
    bffRequest<AssuntoResponse>(`/avaliacoes/criar-assunto/${materiaId}`, {
      method: "POST",
      body,
    }),
  patchAssunto: (id: string, body: AssuntoPatch) =>
    bffRequest<AssuntoResponse>(`/avaliacoes/editar-assunto/${id}`, { method: "PUT", body }),
  deleteAssunto: (id: string) =>
    bffRequest<void>(`/avaliacoes/apagar-assunto/${id}`, { method: "DELETE" }),
  createPasta: (assuntoId: string, body: PastaCreate) =>
    bffRequest<PastaResponse>(`/avaliacoes/criar-pasta/${assuntoId}`, {
      method: "POST",
      body,
    }),
  getPasta: (id: string) => bffRequest<PastaResponse>(`/avaliacoes/consultar-pasta/${id}`),
  patchPasta: (id: string, body: PastaPatch) =>
    bffRequest<PastaResponse>(`/avaliacoes/editar-pasta/${id}`, { method: "PUT", body }),
  listAvaliacoesPasta: (pastaId: string) =>
    bffRequest<AvaliacaoListItem[]>(`/avaliacoes/consultar-avaliacoes-pasta/${pastaId}`),
  createAvaliacao: (pastaId: string, body: AvaliacaoCreate) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/criar-avaliacao/${pastaId}`, {
      method: "POST",
      body,
    }),
  getAvaliacao: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/consultar-avaliacao/${id}`),
  patchAvaliacao: (id: string, body: AvaliacaoPatch) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/editar-avaliacao/${id}`, { method: "PUT", body }),
  salvarRascunho: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/salvar-rascunho-avaliacao/${id}`, {
      method: "POST",
    }),
  publicar: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/publicar-avaliacao/${id}`, { method: "POST" }),
  encerrar: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/encerrar-avaliacao/${id}`, { method: "POST" }),
  replaceQuestoes: (id: string, body: QuestoesBulkReplace) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/substituir-questoes-avaliacao/${id}`, {
      method: "PUT",
      body,
    }),
  addQuestao: (id: string, body: QuestaoUpsert) =>
    bffRequest<QuestaoResponse>(`/avaliacoes/criar-questao/${id}`, {
      method: "POST",
      body,
    }),
  reordenarQuestoes: (id: string, body: QuestoesReorder) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/reordenar-questoes/${id}`, {
      method: "POST",
      body,
    }),
  patchQuestao: (avaliacaoId: string, questaoId: string, body: QuestaoUpsert) =>
    bffRequest<QuestaoResponse>(
      `/avaliacoes/editar-questao/${avaliacaoId}/${questaoId}`,
      { method: "PUT", body }
    ),
  deleteQuestao: (avaliacaoId: string, questaoId: string) =>
    bffRequest<void>(`/avaliacoes/apagar-questao/${avaliacaoId}/${questaoId}`, {
      method: "DELETE",
    }),
}

export const alunoAvaliacoesRequests = {
  disponiveis: () => bffRequest<AlunoAvaliacaoDisponivel[]>("/avaliacoes/consultar-disponiveis"),
  getView: (id: string) =>
    bffRequest<AlunoAvaliacaoView>(`/avaliacoes/consultar-avaliacao-resolver/${id}`),
  createSubmissao: (avaliacaoId: string) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/iniciar-submissao/${avaliacaoId}`, {
      method: "POST",
    }),
  patchSubmissao: (id: string, body: SubmissaoPatch) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/atualizar-submissao/${id}`, { method: "PUT", body }),
  enviarSubmissao: (id: string) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/enviar-submissao/${id}`, { method: "POST" }),
}
