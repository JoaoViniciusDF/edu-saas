import type { TipoAnexoMaterial } from "./common"

export interface PastaConteudoResponse {
  id: string
  nome_disciplina: string
  turma_id?: string | null
  cor_token_ui?: string | null
  icone?: string | null
  ordem?: number | null
}

export interface PastaConteudoCreate {
  nome_disciplina: string
  turma_id?: string | null
  cor_token_ui?: string | null
  icone?: string | null
  ordem?: number | null
}

export interface PastaConteudoPatch {
  nome_disciplina?: string | null
  turma_id?: string | null
  cor_token_ui?: string | null
  icone?: string | null
  ordem?: number | null
}

export interface MaterialResponse {
  id: string
  titulo: string
  descricao?: string | null
  tipo_anexo: TipoAnexoMaterial
  corpo_texto?: string | null
  url_objeto?: string | null
  ordem_exibicao?: number | null
}

export interface MaterialCreate {
  titulo: string
  descricao?: string | null
  tipo_anexo: TipoAnexoMaterial
  corpo_texto?: string | null
  url_objeto?: string | null
  blob_id?: string | null
  ordem_exibicao?: number | null
}

export interface MaterialPatch {
  titulo?: string | null
  descricao?: string | null
  tipo_anexo?: TipoAnexoMaterial | null
  corpo_texto?: string | null
  url_objeto?: string | null
  ordem_exibicao?: number | null
}

export interface PresignRequest {
  nome_original: string
  mime_type: string
  tamanho_bytes: number
  contexto: string
}

export interface PresignResponse {
  upload_id: string
  upload_url: string
  storage_key: string
}
