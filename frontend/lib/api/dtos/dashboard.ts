export interface SearchHit {
  id: string
  tipo: string
  titulo: string
  subtitulo?: string | null
  url_deep_link?: string | null
}

export interface NotificacaoItem {
  id: string
  titulo: string
  corpo_curto: string
  tipo_evento: string
  lida_flag: boolean
  link_profundo?: string | null
  criado_em?: string | null
}

export interface DashboardResumo {
  media_geral?: string | number | null
  taxa_aprovacao?: string | number | null
  pendentes_correcao: number
  total_alunos_escopo: number
  insights: string[]
}

export interface DashboardQueryParams {
  escopo?: string | null
  turma_id?: string | null
  aluno_id?: string | null
  data_inicio?: string | null
  data_fim?: string | null
}

export interface DashboardSerieItem {
  periodo: string
  turma_id?: string | null
  turma_nome?: string | null
  aluno_id?: string | null
  aluno_nome?: string | null
  disciplina?: string | null
  media?: number | string | null
  taxa_aprovacao?: number | string | null
  pendentes_correcao?: number | null
}

export interface DashboardSeriesResponse {
  items: DashboardSerieItem[]
}

export interface DashboardSerieItem {
  periodo: string
  turma_id?: string | null
  turma_nome?: string | null
  aluno_id?: string | null
  aluno_nome?: string | null
  disciplina?: string | null
  media?: string | number | null
  taxa_aprovacao?: string | number | null
  pendentes_correcao?: number | null
}

export interface DashboardSeriesResponse {
  items: DashboardSerieItem[]
}
