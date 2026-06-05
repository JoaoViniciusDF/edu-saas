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

export interface DashboardQueryParams
  extends Record<string, string | number | boolean | null | undefined> {
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

export interface DesempenhoAvaliacaoItem {
  id: string
  titulo: string
  percentual?: number | null
  nota_decimal?: string | number | null
  situacao: string
  enviada_em?: string | null
  aluno_nome?: string | null
}

export interface DesempenhoAssuntoItem {
  id: string
  nome: string
  media_percentual?: number | null
  avaliacoes: DesempenhoAvaliacaoItem[]
}

export interface DesempenhoMateriaItem {
  id: string
  nome: string
  media_percentual?: number | null
  assuntos: DesempenhoAssuntoItem[]
}

export interface DashboardDesempenhoAvaliacoesResponse {
  materias: DesempenhoMateriaItem[]
}
