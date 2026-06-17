import { bffRequest } from "../client"
import type {
  AlunoAvaliacaoDisponivel,
  AlunoAvaliacaoView,
  AvaliacaoDuplicar,
  AvaliacaoReabrir,
  ArvoreMateria,
  AssuntoCreate,
  AssuntoPatch,
  AssuntoResponse,
  AvaliacaoCreate,
  AvaliacaoDetail,
  AvaliacaoListItem,
  AvaliacaoPatch,
  AvaliacaoPublicar,
  ChatMensagem,
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
  SubmissoesAvaliacaoProfessor,
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
  getArvore: (materiaId: string, turmaId?: string | null) => {
    const q = turmaId ? `?turma_id=${turmaId}` : ""
    return bffRequest<ArvoreMateria>(
      `/avaliacoes/consultar-arvore-materia/${materiaId}${q}`
    )
  },
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
  listAvaliacoesPasta: (pastaId: string, turmaId?: string | null) => {
    const q = turmaId ? `?turma_id=${turmaId}` : ""
    return bffRequest<AvaliacaoListItem[]>(
      `/avaliacoes/consultar-avaliacoes-pasta/${pastaId}${q}`
    )
  },
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
  publicar: (id: string, body: AvaliacaoPublicar) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/publicar-avaliacao/${id}`, {
      method: "POST",
      body,
    }),
  encerrar: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/encerrar-avaliacao/${id}`, { method: "POST" }),
  inativar: (id: string) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/inativar-avaliacao/${id}`, { method: "POST" }),
  apagar: (id: string) =>
    bffRequest<void>(`/avaliacoes/apagar-avaliacao/${id}`, { method: "DELETE" }),
  duplicar: (id: string, body?: AvaliacaoDuplicar) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/duplicar-avaliacao/${id}`, {
      method: "POST",
      body: body ?? {},
    }),
  reabrir: (id: string, body?: AvaliacaoReabrir) =>
    bffRequest<AvaliacaoDetail>(`/avaliacoes/reabrir-avaliacao/${id}`, {
      method: "POST",
      body: body ?? {},
    }),
  listSubmissoes: (avaliacaoId: string) =>
    bffRequest<SubmissoesAvaliacaoProfessor>(
      `/avaliacoes/consultar-submissoes-avaliacao/${avaliacaoId}`
    ),
  getSubmissaoAluno: (avaliacaoId: string, alunoId: string) =>
    bffRequest<AlunoAvaliacaoView>(
      `/avaliacoes/consultar-submissao-avaliacao/${avaliacaoId}/${alunoId}`
    ),
  reabrirSubmissaoAluno: (submissaoId: string) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/reabrir-submissao-aluno/${submissaoId}`, {
      method: "POST",
    }),
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
  chatIaHistorico: (avaliacaoId: string) =>
    bffRequest<ChatMensagem[]>(`/avaliacoes/consultar-chat-ia/${avaliacaoId}`),
}

export const alunoAvaliacoesRequests = {
  disponiveis: () => bffRequest<AlunoAvaliacaoDisponivel[]>("/avaliacoes/consultar-disponiveis"),
  getView: (id: string) =>
    bffRequest<AlunoAvaliacaoView>(`/avaliacoes/consultar-avaliacao-resolver/${id}`),
  disponiveisDependente: (alunoId: string) =>
    bffRequest<AlunoAvaliacaoDisponivel[]>(
      `/avaliacoes/consultar-avaliacoes-dependente?aluno_id=${alunoId}`
    ),
  getViewDependente: (id: string, alunoId: string) =>
    bffRequest<AlunoAvaliacaoView>(
      `/avaliacoes/consultar-avaliacao-dependente/${id}?aluno_id=${alunoId}`
    ),
  createSubmissao: (avaliacaoId: string) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/iniciar-submissao/${avaliacaoId}`, {
      method: "POST",
    }),
  patchSubmissao: (id: string, body: SubmissaoPatch) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/atualizar-submissao/${id}`, { method: "PUT", body }),
  enviarSubmissao: (id: string) =>
    bffRequest<SubmissaoResponse>(`/avaliacoes/enviar-submissao/${id}`, { method: "POST" }),
}
