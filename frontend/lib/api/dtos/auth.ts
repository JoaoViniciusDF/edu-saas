import type { TipoPerfil } from "./common"

export interface LoginRequest {
  email: string
  senha: string
}

export interface UserMe {
  usuario_id: string
  email: string
  nome_exibicao: string
  perfil: TipoPerfil
  instituicao_id: string | null
  preferencias?: Record<string, unknown> | null
  professor_id?: string | null
  aluno_id?: string | null
  responsavel_id?: string | null
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expira_em: string
  usuario: UserMe
}

export interface RefreshRequest {
  refresh_token: string
}

export interface UserPreferencesPatch {
  tema?: string | null
  idioma?: string | null
  densidade_ui?: string | null
}
