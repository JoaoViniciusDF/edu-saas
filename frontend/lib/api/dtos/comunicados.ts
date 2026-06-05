import type { StatusComunicado, TipoDestinatarioComunicado } from "./common"

export interface DestinatarioRef {
  tipo: TipoDestinatarioComunicado
  id: string
}

export interface ComunicadoListItem {
  id: string
  titulo: string
  status: StatusComunicado
  publicado_em?: string | null
  lido: boolean
  preview_corpo?: string | null
}

export interface ComunicadoLeituraItem {
  usuario_id: string
  nome_exibicao: string
  lido: boolean
  lido_em?: string | null
}

export interface ComunicadoLeiturasResponse {
  total_destinatarios: number
  total_lidos: number
  itens: ComunicadoLeituraItem[]
}

export interface ComunicadoDetail {
  id: string
  titulo: string
  corpo: string
  status: StatusComunicado
  publicado_em?: string | null
  imagens_urls: string[]
  destinatarios: DestinatarioRef[]
  lido: boolean
  total_destinatarios?: number | null
  total_lidos?: number | null
}

export interface ComunicadoCreate {
  titulo: string
  corpo?: string
  imagens_urls?: string[]
  destinatarios?: DestinatarioRef[]
  status_inicial?: StatusComunicado
}

export interface ComunicadoPatch {
  titulo?: string | null
  corpo?: string | null
  imagens_urls?: string[] | null
  destinatarios?: DestinatarioRef[] | null
}
