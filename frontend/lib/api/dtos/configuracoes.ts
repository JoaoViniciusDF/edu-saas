import type { SituacaoMatricula } from "./common"

export interface InstituicaoResponse {
  id: string
  nome_fantasia: string
  documento_legal?: string | null
  configuracoes?: Record<string, unknown> | null
}

export interface InstituicaoCreate {
  nome_fantasia: string
  documento_legal?: string | null
  administrador_inicial?: {
    email: string
    senha: string
    nome_exibicao: string
  } | null
}

export interface InstituicaoPatch {
  nome_fantasia?: string | null
  documento_legal?: string | null
  configuracoes?: Record<string, unknown> | null
}

export interface SuperAdminResumo {
  total_instituicoes: number
  total_professores: number
  total_turmas: number
  total_alunos: number
}

export interface ProfessorListItem {
  id: string
  usuario_id: string
  nome_exibicao: string
  email: string
  registro_funcional?: string | null
  instituicao_id?: string | null
  instituicao_nome?: string | null
}

export interface ProfessorCreate {
  email: string
  senha: string
  nome_exibicao: string
  registro_funcional?: string | null
  areas_especialidade?: string | null
}

export interface ProfessorPatch {
  nome_exibicao?: string | null
  registro_funcional?: string | null
  areas_especialidade?: string | null
}

export interface AlunoListItem {
  id: string
  usuario_id: string
  nome_exibicao: string
  email: string
  matricula_codigo?: string | null
}

export interface AlunoCreate {
  email: string
  senha: string
  nome_exibicao: string
  matricula_codigo?: string | null
  data_nascimento?: string | null
}

export interface AlunoPatch {
  nome_exibicao?: string | null
  matricula_codigo?: string | null
  data_nascimento?: string | null
}

export interface ResponsavelListItem {
  id: string
  usuario_id: string
  nome_exibicao: string
  email: string
  grau_parentesco?: string | null
}

export interface ResponsavelCreate {
  email: string
  senha: string
  nome_exibicao: string
  grau_parentesco?: string | null
  telefone?: string | null
}

export interface VinculoResponsavelCreate {
  responsavel_id: string
  responsavel_principal?: boolean
}

export interface ResponsavelVinculoItem {
  id: string
  nome_exibicao: string
  email: string
  responsavel_principal: boolean
}

export interface TurmaListItem {
  id: string
  nome: string
  ano_letivo: string
  turno?: string | null
  professor_titular_nome?: string | null
  contagem_alunos?: number | null
}

export interface TurmaCreate {
  nome: string
  ano_letivo: string
  turno?: string | null
  professor_titular_id?: string | null
}

export interface TurmaPatch {
  nome?: string | null
  ano_letivo?: string | null
  turno?: string | null
  professor_titular_id?: string | null
}

export interface MatriculaCreate {
  aluno_id: string
  turma_id: string
  data_inicio?: string | null
}

export interface MatriculaPatch {
  situacao?: SituacaoMatricula | null
  data_fim?: string | null
}

export interface MatriculaResponse {
  id: string
  aluno_id: string
  turma_id: string
  situacao: SituacaoMatricula
  data_inicio: string
  data_fim?: string | null
}
