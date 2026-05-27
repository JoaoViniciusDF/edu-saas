export interface ErrorEnvelope {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null
  has_more: boolean
}

export type TipoPerfil =
  | "super_admin"
  | "administrador"
  | "professor"
  | "aluno"
  | "responsavel"

export type StatusAvaliacao = "rascunho" | "publicada" | "encerrada"
export type StatusSubmissao =
  | "rascunho"
  | "enviada"
  | "corrigida_parcialmente"
  | "corrigida"
export type TipoQuestao = "multipla_escolha" | "texto_aberto"
export type TipoAnexoMaterial = "pdf" | "audio" | "imagem" | "video" | "nota"
export type StatusComunicado = "rascunho" | "publicado"
export type TipoDestinatarioComunicado = "aluno" | "turma" | "responsavel"
export type SituacaoMatricula = "ativa" | "encerrada" | "transferida"
