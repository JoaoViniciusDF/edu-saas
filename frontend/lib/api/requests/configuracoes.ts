import { bffRequest } from "../client"
import type { LoginRequest, LoginResponse, UserMe, UserPreferencesPatch } from "../dtos/auth"
import type { PaginatedResponse } from "../dtos/common"
import type {
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
} from "../dtos/configuracoes"

export const authRequests = {
  login: (body: LoginRequest) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  logout: () => fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
  me: async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? "Não autenticado")
    }
    return res.json() as Promise<UserMe>
  },
  patchPreferences: (body: UserPreferencesPatch) =>
    bffRequest<UserMe>("/users/me/preferences", { method: "PATCH", body }),
}

export const adminRequests = {
  listInstituicoes: (cursor?: string) =>
    bffRequest<PaginatedResponse<InstituicaoResponse>>("/admin/instituicoes", {
      searchParams: { cursor },
    }),
  createInstituicao: (body: InstituicaoCreate) =>
    bffRequest<InstituicaoResponse>("/admin/instituicoes", { method: "POST", body }),
  getInstituicao: (id: string) => bffRequest<InstituicaoResponse>(`/admin/instituicoes/${id}`),
  patchInstituicao: (id: string, body: InstituicaoPatch) =>
    bffRequest<InstituicaoResponse>(`/admin/instituicoes/${id}`, { method: "PATCH", body }),
  superAdminResumo: () => bffRequest<SuperAdminResumo>("/super-admin/resumo"),
  superAdminProfessores: (instituicao_id?: string) =>
    bffRequest<ProfessorListItem[]>("/super-admin/professores", {
      searchParams: { instituicao_id },
    }),
  superAdminTurmas: (instituicao_id?: string) =>
    bffRequest<TurmaListItem[]>("/super-admin/turmas", { searchParams: { instituicao_id } }),
}

export const cadastrosRequests = {
  listProfessores: () => bffRequest<ProfessorListItem[]>("/cadastros/professores"),
  createProfessor: (body: ProfessorCreate) =>
    bffRequest<ProfessorListItem>("/cadastros/professores", { method: "POST", body }),
  getProfessor: (id: string) => bffRequest<ProfessorListItem>(`/cadastros/professores/${id}`),
  patchProfessor: (id: string, body: ProfessorPatch) =>
    bffRequest<ProfessorListItem>(`/cadastros/professores/${id}`, { method: "PATCH", body }),
  deleteProfessor: (id: string) =>
    bffRequest<void>(`/cadastros/professores/${id}`, { method: "DELETE" }),
  listAlunos: () => bffRequest<AlunoListItem[]>("/cadastros/alunos"),
  createAluno: (body: AlunoCreate) =>
    bffRequest<AlunoListItem>("/cadastros/alunos", { method: "POST", body }),
  getAluno: (id: string) => bffRequest<AlunoListItem>(`/cadastros/alunos/${id}`),
  patchAluno: (id: string, body: AlunoPatch) =>
    bffRequest<AlunoListItem>(`/cadastros/alunos/${id}`, { method: "PATCH", body }),
  listResponsaveis: () => bffRequest<ResponsavelListItem[]>("/cadastros/responsaveis"),
  getResponsavel: (id: string) =>
    bffRequest<ResponsavelListItem>(`/cadastros/responsaveis/${id}`),
  createResponsavel: (body: ResponsavelCreate) =>
    bffRequest<ResponsavelListItem>("/cadastros/responsaveis", { method: "POST", body }),
  getInstituicao: (id: string) => bffRequest<InstituicaoResponse>(`/instituicoes/${id}`),
  patchInstituicao: (id: string, body: InstituicaoPatch) =>
    bffRequest<InstituicaoResponse>(`/instituicoes/${id}`, { method: "PATCH", body }),
  vincularResponsavel: (alunoId: string, body: VinculoResponsavelCreate) =>
    bffRequest<void>(`/cadastros/alunos/${alunoId}/responsaveis`, { method: "POST", body }),
  desvincularResponsavel: (alunoId: string, responsavelId: string) =>
    bffRequest<void>(`/cadastros/alunos/${alunoId}/responsaveis/${responsavelId}`, {
      method: "DELETE",
    }),
  listTurmas: () => bffRequest<TurmaListItem[]>("/cadastros/turmas"),
  createTurma: (body: TurmaCreate) =>
    bffRequest<TurmaListItem>("/cadastros/turmas", { method: "POST", body }),
  getTurma: (id: string) => bffRequest<TurmaListItem>(`/cadastros/turmas/${id}`),
  patchTurma: (id: string, body: TurmaPatch) =>
    bffRequest<TurmaListItem>(`/cadastros/turmas/${id}`, { method: "PATCH", body }),
  createMatricula: (body: MatriculaCreate) =>
    bffRequest<MatriculaResponse>("/cadastros/matriculas", { method: "POST", body }),
  patchMatricula: (id: string, body: MatriculaPatch) =>
    bffRequest<MatriculaResponse>(`/cadastros/matriculas/${id}`, { method: "PATCH", body }),
  listTurmaAlunos: (turmaId: string) =>
    bffRequest<AlunoListItem[]>(`/turmas/${turmaId}/alunos`),
  listAlunoResponsaveis: (alunoId: string) =>
    bffRequest<ResponsavelVinculoItem[]>(`/alunos/${alunoId}/responsaveis`),
}

export const leituraRequests = {
  listTurmas: () => bffRequest<TurmaListItem[]>("/turmas"),
  getInstituicao: (id: string) => bffRequest<InstituicaoResponse>(`/instituicoes/${id}`),
  patchInstituicao: (id: string, body: InstituicaoPatch) =>
    bffRequest<InstituicaoResponse>(`/instituicoes/${id}`, { method: "PATCH", body }),
}

