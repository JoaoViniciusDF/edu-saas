import { bffRequest } from "../client"
import type { LoginRequest, UserMe, UserPreferencesPatch } from "../dtos/auth"
import type { PaginatedResponse } from "../dtos/common"
import type {
  AlunoListItem,
  AlunoPatch,
  AssociarProfessoresTurmaLoteBody,
  AssociarProfessorTurmasLoteBody,
  AssociarUsuarioInstituicaoBody,
  DesassociarProfessorTurmasLoteBody,
  DesvincularResponsavelAlunosLoteBody,
  DiretorioPlataformaParams,
  DiretorioPlataformaResponse,
  InstituicaoCreate,
  InstituicaoPatch,
  InstituicaoResponse,
  LoteResultadoResponse,
  MatriculaCreate,
  MatriculaPatch,
  MatriculaResponse,
  MatriculasLoteCreate,
  ProfessorListItem,
  ProfessorPatch,
  ResponsavelListItem,
  ResponsavelPatch,
  ResponsavelVinculoItem,
  SuperAdminResumo,
  InstituicaoResumoResponse,
  TurmaCreate,
  TurmaListItem,
  TurmaResumoItem,
  TurmaPatch,
  UsuarioCreate,
  UsuarioCreateResponse,
  UsuarioDetalheResponse,
  UsuarioSuperAdminPatch,
  VincularResponsavelAlunosLoteBody,
  VinculoResponsavelCreate,
} from "../dtos/configuracoes"

export const configuracoesRequests = {
  listInstituicoes: (cursor?: string) =>
    bffRequest<PaginatedResponse<InstituicaoResponse>>("/configuracoes/consultar-instituicoes", {
      searchParams: { cursor },
    }),
  createInstituicao: (body: InstituicaoCreate) =>
    bffRequest<InstituicaoResponse>("/configuracoes/criar-instituicao", { method: "POST", body }),
  getInstituicao: (id: string) =>
    bffRequest<InstituicaoResponse>(`/configuracoes/consultar-instituicao/${id}`),
  patchInstituicao: (id: string, body: InstituicaoPatch) =>
    bffRequest<InstituicaoResponse>(`/configuracoes/editar-instituicao/${id}`, { method: "PUT", body }),
  getMinhaInstituicao: () =>
    bffRequest<InstituicaoResponse>("/configuracoes/consultar-minha-instituicao"),
  superAdminResumo: () =>
    bffRequest<SuperAdminResumo>("/configuracoes/consultar-resumo-plataforma"),
  consultarDiretorioPlataforma: (params: DiretorioPlataformaParams) => {
    const search = new URLSearchParams()
    search.set("visao", params.visao)
    if (params.instituicao_id) search.set("instituicao_id", params.instituicao_id)
    if (params.perfil) search.set("perfil", params.perfil)
    if (params.busca) search.set("busca", params.busca)
    if (params.limit != null) search.set("limit", String(params.limit))
    if (params.offset != null) search.set("offset", String(params.offset))
    params.turma_ids?.forEach((id) => search.append("turma_ids", id))
    const qs = search.toString()
    return bffRequest<DiretorioPlataformaResponse>(
      `/configuracoes/consultar-diretorio-plataforma${qs ? `?${qs}` : ""}`
    )
  },
  getDetalheUsuario: (id: string) =>
    bffRequest<UsuarioDetalheResponse>(`/configuracoes/consultar-detalhe-usuario/${id}`),
  patchUsuarioSuperAdmin: (id: string, body: UsuarioSuperAdminPatch) =>
    bffRequest<UsuarioDetalheResponse>(`/configuracoes/editar-usuario/${id}`, { method: "PUT", body }),
  desativarUsuario: (id: string) =>
    bffRequest<void>(`/configuracoes/desativar-usuario/${id}`, { method: "DELETE" }),
  associarUsuarioInstituicao: (id: string, body: AssociarUsuarioInstituicaoBody) =>
    bffRequest<UsuarioDetalheResponse>(`/configuracoes/associar-usuario-instituicao/${id}`, {
      method: "PUT",
      body,
    }),
  criarMatriculasLote: (body: MatriculasLoteCreate) =>
    bffRequest<LoteResultadoResponse>("/configuracoes/criar-matriculas-lote", {
      method: "POST",
      body,
    }),
  vincularResponsavelAlunosLote: (body: VincularResponsavelAlunosLoteBody) =>
    bffRequest<LoteResultadoResponse>("/configuracoes/vincular-responsavel-alunos-lote", {
      method: "POST",
      body,
    }),
  desvincularResponsavelAlunosLote: (body: DesvincularResponsavelAlunosLoteBody) =>
    bffRequest<LoteResultadoResponse>("/configuracoes/desvincular-responsavel-alunos-lote", {
      method: "DELETE",
      body,
    }),
  associarProfessorTurmasLote: (body: AssociarProfessorTurmasLoteBody) =>
    bffRequest<LoteResultadoResponse>("/configuracoes/associar-professor-turmas-lote", {
      method: "PUT",
      body,
    }),
  associarProfessoresTurmaLote: (body: AssociarProfessoresTurmaLoteBody) =>
    bffRequest<LoteResultadoResponse>("/configuracoes/associar-professores-turma-lote", {
      method: "POST",
      body,
    }),
  desassociarProfessorTurmasLote: (body: DesassociarProfessorTurmasLoteBody) =>
    bffRequest<LoteResultadoResponse>("/configuracoes/desassociar-professor-turmas-lote", {
      method: "DELETE",
      body,
    }),
  patchMatriculaSuperAdmin: (matId: string, instituicaoId: string, body: MatriculaPatch) =>
    bffRequest<MatriculaResponse>(
      `/configuracoes/editar-matricula-super-admin/${matId}?instituicao_id=${instituicaoId}`,
      { method: "PUT", body }
    ),
  getResumoInstituicao: (id: string) =>
    bffRequest<InstituicaoResumoResponse>(`/configuracoes/consultar-resumo-instituicao/${id}`),
  createUsuario: (body: UsuarioCreate) =>
    bffRequest<UsuarioCreateResponse>("/configuracoes/criar-usuario", { method: "POST", body }),
  listProfessores: (instituicao_id?: string) =>
    bffRequest<ProfessorListItem[]>("/configuracoes/consultar-professores", {
      searchParams: { instituicao_id },
    }),
  getProfessor: (id: string) =>
    bffRequest<ProfessorListItem>(`/configuracoes/consultar-professor/${id}`),
  patchProfessor: (id: string, body: ProfessorPatch) =>
    bffRequest<ProfessorListItem>(`/configuracoes/editar-professor/${id}`, { method: "PUT", body }),
  deleteProfessor: (id: string) =>
    bffRequest<void>(`/configuracoes/desativar-professor/${id}`, { method: "DELETE" }),
  listAlunos: (instituicao_id?: string) =>
    bffRequest<AlunoListItem[]>("/configuracoes/consultar-alunos", {
      searchParams: { instituicao_id },
    }),
  getAluno: (id: string) => bffRequest<AlunoListItem>(`/configuracoes/consultar-aluno/${id}`),
  patchAluno: (id: string, body: AlunoPatch) =>
    bffRequest<AlunoListItem>(`/configuracoes/editar-aluno/${id}`, { method: "PUT", body }),
  deleteAluno: (id: string) =>
    bffRequest<void>(`/configuracoes/apagar-aluno/${id}`, { method: "DELETE" }),
  listResponsaveis: (instituicao_id?: string) =>
    bffRequest<ResponsavelListItem[]>("/configuracoes/consultar-responsaveis", {
      searchParams: { instituicao_id },
    }),
  getResponsavel: (id: string) =>
    bffRequest<ResponsavelListItem>(`/configuracoes/consultar-responsavel/${id}`),
  patchResponsavel: (id: string, body: ResponsavelPatch) =>
    bffRequest<ResponsavelListItem>(`/configuracoes/editar-responsavel/${id}`, {
      method: "PUT",
      body,
    }),
  vincularResponsavel: (alunoId: string, body: VinculoResponsavelCreate) =>
    bffRequest<void>(`/configuracoes/vincular-responsavel-aluno/${alunoId}`, {
      method: "POST",
      body,
    }),
  desvincularResponsavel: (alunoId: string, responsavelId: string) =>
    bffRequest<void>(
      `/configuracoes/desvincular-responsavel-aluno/${alunoId}/${responsavelId}`,
      { method: "DELETE" }
    ),
  listTurmas: (params?: { nome?: string; instituicao_id?: string }) =>
    bffRequest<TurmaListItem[]>("/configuracoes/consultar-turmas", { searchParams: params }),
  listTurmasResumo: (params?: { nome?: string; instituicao_id?: string }) =>
    bffRequest<TurmaResumoItem[]>("/configuracoes/consultar-turmas-resumo", {
      searchParams: params,
    }),
  createTurma: (body: TurmaCreate) =>
    bffRequest<TurmaListItem>("/configuracoes/criar-turma", { method: "POST", body }),
  getTurma: (id: string) => bffRequest<TurmaListItem>(`/configuracoes/consultar-turma/${id}`),
  patchTurma: (id: string, body: TurmaPatch) =>
    bffRequest<TurmaListItem>(`/configuracoes/editar-turma/${id}`, { method: "PUT", body }),
  createMatricula: (body: MatriculaCreate) =>
    bffRequest<MatriculaResponse>("/configuracoes/criar-matricula", { method: "POST", body }),
  patchMatricula: (id: string, body: MatriculaPatch) =>
    bffRequest<MatriculaResponse>(`/configuracoes/editar-matricula/${id}`, { method: "PUT", body }),
  listTurmaAlunos: (turmaId: string) =>
    bffRequest<AlunoListItem[]>(`/configuracoes/consultar-alunos-turma/${turmaId}`),
  listAlunoResponsaveis: (alunoId: string) =>
    bffRequest<ResponsavelVinculoItem[]>(
      `/configuracoes/consultar-responsaveis-aluno/${alunoId}`
    ),
  atualizarPreferencias: (body: UserPreferencesPatch) =>
    bffRequest<UserMe>("/configuracoes/atualizar-preferencias", { method: "PUT", body }),
}

export const authRequests = {
  login: (body: LoginRequest) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  logout: () => fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
  assumirSessao: async (usuarioId: string) => {
    const res = await fetch("/api/auth/assumir-sessao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: usuarioId }),
      credentials: "include",
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? "Falha ao assumir sessão")
    }
    return res.json() as Promise<{ usuario: UserMe }>
  },
  restaurarSessaoAdmin: async () => {
    const res = await fetch("/api/auth/restaurar-sessao-admin", {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? "Falha ao restaurar sessão")
    }
    return res.json() as Promise<{ usuario: UserMe }>
  },
  me: async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? "Não autenticado")
    }
    return res.json() as Promise<UserMe>
  },
  patchPreferences: (body: UserPreferencesPatch) =>
    configuracoesRequests.atualizarPreferencias(body),
}

/** @deprecated Use configuracoesRequests */
export const adminRequests = {
  listInstituicoes: configuracoesRequests.listInstituicoes,
  createInstituicao: configuracoesRequests.createInstituicao,
  getInstituicao: configuracoesRequests.getInstituicao,
  patchInstituicao: configuracoesRequests.patchInstituicao,
  superAdminResumo: configuracoesRequests.superAdminResumo,
  getResumoInstituicao: configuracoesRequests.getResumoInstituicao,
  superAdminProfessores: (instituicao_id?: string) =>
    configuracoesRequests.listProfessores(instituicao_id),
  superAdminTurmas: (instituicao_id?: string) =>
    configuracoesRequests.listTurmas({ instituicao_id }),
}

/** @deprecated Use configuracoesRequests */
export const cadastrosRequests = {
  listProfessores: () => configuracoesRequests.listProfessores(),
  createUsuario: configuracoesRequests.createUsuario,
  getProfessor: configuracoesRequests.getProfessor,
  patchProfessor: configuracoesRequests.patchProfessor,
  deleteProfessor: configuracoesRequests.deleteProfessor,
  listAlunos: () => configuracoesRequests.listAlunos(),
  getAluno: configuracoesRequests.getAluno,
  patchAluno: configuracoesRequests.patchAluno,
  listResponsaveis: configuracoesRequests.listResponsaveis,
  getResponsavel: configuracoesRequests.getResponsavel,
  getInstituicao: (id: string) => configuracoesRequests.getInstituicao(id),
  patchInstituicao: configuracoesRequests.patchInstituicao,
  vincularResponsavel: configuracoesRequests.vincularResponsavel,
  desvincularResponsavel: configuracoesRequests.desvincularResponsavel,
  listTurmas: () => configuracoesRequests.listTurmas(),
  createTurma: configuracoesRequests.createTurma,
  getTurma: configuracoesRequests.getTurma,
  patchTurma: configuracoesRequests.patchTurma,
  createMatricula: configuracoesRequests.createMatricula,
  patchMatricula: configuracoesRequests.patchMatricula,
  listTurmaAlunos: configuracoesRequests.listTurmaAlunos,
  listAlunoResponsaveis: configuracoesRequests.listAlunoResponsaveis,
}

/** @deprecated Use configuracoesRequests */
export const leituraRequests = {
  listTurmas: () => configuracoesRequests.listTurmasResumo(),
  getInstituicao: (id: string) => configuracoesRequests.getInstituicao(id),
  patchInstituicao: configuracoesRequests.patchInstituicao,
}
