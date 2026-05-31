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

export interface UsuarioInstituicaoItem {
  usuario_id: string
  email: string
  nome_exibicao: string
  perfil: TipoPerfilUsuario
  professor_id?: string | null
  aluno_id?: string | null
  responsavel_id?: string | null
}

export interface InstituicaoResumoResponse {
  instituicao: InstituicaoResponse
  contagem_professores: number
  contagem_alunos: number
  contagem_turmas: number
  contagem_responsaveis: number
  contagem_administradores: number
  usuarios: UsuarioInstituicaoItem[]
}

export type TipoPerfilUsuario =
  | "super_admin"
  | "administrador"
  | "professor"
  | "aluno"
  | "responsavel"

export interface UsuarioCreate {
  email: string
  senha: string
  nome_exibicao: string
  tipo_perfil: TipoPerfilUsuario
  instituicao_id?: string | null
  registro_funcional?: string | null
  areas_especialidade?: string | null
  matricula_codigo?: string | null
  data_nascimento?: string | null
  grau_parentesco?: string | null
  telefone?: string | null
}

export interface UsuarioCreateResponse {
  usuario_id: string
  tipo_perfil: TipoPerfilUsuario
  email: string
  nome_exibicao: string
  instituicao_id?: string | null
  professor_id?: string | null
  aluno_id?: string | null
  responsavel_id?: string | null
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

export interface ResponsavelPatch {
  nome_exibicao?: string | null
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
  grau_parentesco?: string | null
  responsavel_principal: boolean
}

export type VisaoPlataforma =
  | "instituicoes"
  | "professores"
  | "alunos"
  | "turmas"
  | "alunos_turma"
  | "professores_turma"
  | "usuarios"

export interface TurmaResumoItem {
  id: string
  nome: string
  ano_letivo: string
  turno?: string | null
}

export interface DiretorioPlataformaItem {
  id: string
  tipo: string
  nome: string
  email?: string | null
  perfil?: TipoPerfilUsuario | null
  instituicao_id?: string | null
  instituicao_nome?: string | null
  documento_legal?: string | null
  matricula_codigo?: string | null
  registro_funcional?: string | null
  ano_letivo?: string | null
  turno?: string | null
  professor_titular_nome?: string | null
  contagem_alunos?: number | null
  contagem_professores?: number | null
  contagem_turmas?: number | null
  turmas?: TurmaResumoItem[] | null
  usuario_id?: string | null
  professor_id?: string | null
  aluno_id?: string | null
}

export interface DiretorioPlataformaResponse {
  items: DiretorioPlataformaItem[]
  total: number
}

export interface DiretorioPlataformaParams {
  visao: VisaoPlataforma
  instituicao_id?: string
  turma_ids?: string[]
  perfil?: TipoPerfilUsuario
  busca?: string
  limit?: number
  offset?: number
}

export interface AlunoDetalheResponse {
  id: string
  usuario_id: string
  nome_exibicao: string
  email: string
  matricula_codigo?: string | null
  data_nascimento?: string | null
  nome_social?: string | null
  instituicao?: InstituicaoResponse | null
  turmas: TurmaResumoItem[]
  responsaveis: ResponsavelVinculoItem[]
}

export interface ProfessorDetalheResponse {
  id: string
  usuario_id: string
  nome_exibicao: string
  email: string
  registro_funcional?: string | null
  areas_especialidade?: string | null
  instituicao?: InstituicaoResponse | null
  turmas_titulares: TurmaResumoItem[]
}

export const PERFIS_CRIACAO: { value: TipoPerfilUsuario; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "professor", label: "Professor" },
  { value: "aluno", label: "Aluno" },
  { value: "responsavel", label: "Responsável" },
]

export interface TurmaListItem {
  id: string
  nome: string
  ano_letivo: string
  turno?: string | null
  professor_titular_id?: string | null
  professor_titular_nome?: string | null
  instituicao_id?: string | null
  instituicao_nome?: string | null
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
