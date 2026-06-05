import type { StatusAvaliacao } from "@/lib/api/dtos/common"

export interface AvaliacaoListaItem {
  id: string
  titulo: string
  status: StatusAvaliacao
  alunosFeitos?: number
  alunosTotal?: number
}

export interface ConteudoAvaliacao {
  id: string
  nome: string
  alunosResponderam?: number
  alunosTotal?: number
  avaliacoesConcluidas: number
  avaliacoesTotal: number
  statusResumo: string
  avaliacoes: AvaliacaoListaItem[]
}

export interface AssuntoAvaliacao {
  id: string
  nome: string
  conteudos: ConteudoAvaliacao[]
}

export interface MateriaAvaliacao {
  id: string
  nome: string
  cor: string
  conteudosCount: number
  assuntos: AssuntoAvaliacao[]
}
