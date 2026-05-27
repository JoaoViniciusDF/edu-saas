import type { StatusAvaliacao, StatusSubmissao, TipoQuestao } from "./common"

export interface MateriaResponse {
  id: string
  nome: string
  slug?: string | null
  cor_token_ui?: string | null
  ordem?: number | null
}

export interface MateriaCreate {
  nome: string
  slug?: string | null
  cor_token_ui?: string | null
  ordem?: number | null
}

export interface MateriaPatch {
  nome?: string | null
  slug?: string | null
  cor_token_ui?: string | null
  ordem?: number | null
}

export interface AssuntoResponse {
  id: string
  nome: string
  ordem: number
}

export interface AssuntoCreate {
  nome: string
  ordem?: number
}

export interface AssuntoPatch {
  nome?: string | null
  ordem?: number | null
}

export interface PastaResponse {
  id: string
  nome: string
  resumo_status_texto?: string | null
  total_avaliacoes?: number | null
  total_submissoes?: number | null
}

export interface PastaCreate {
  nome: string
}

export interface PastaPatch {
  nome?: string | null
}

export interface AvaliacaoListItem {
  id: string
  titulo: string
  status: StatusAvaliacao
  prazo_utc?: string | null
  publicado_em?: string | null
}

export interface QuestaoResponse {
  id: string
  ordem: number
  tipo: TipoQuestao
  enunciado: string
  conteudo?: Record<string, unknown> | null
  alternativas?: string[] | null
  resposta_correta?: number | null
  peso: string | number
}

export interface AvaliacaoDetail {
  id: string
  pasta_id: string
  titulo: string
  status: StatusAvaliacao
  prazo_utc?: string | null
  publicado_em?: string | null
  encerrada_em?: string | null
  payload_editor?: Record<string, unknown> | null
  instrucoes_gerais?: Record<string, unknown> | null
  versao: number
  questoes: QuestaoResponse[]
}

export interface AvaliacaoCreate {
  titulo: string
  prazo_utc?: string | null
}

export interface AvaliacaoPatch {
  titulo?: string | null
  prazo_utc?: string | null
  payload_editor?: Record<string, unknown> | null
}

export interface QuestaoUpsert {
  id?: string | null
  tipo: TipoQuestao
  ordem: number
  enunciado?: string
  conteudo?: Record<string, unknown> | null
  alternativas?: string[] | null
  resposta_correta?: number | null
  peso?: string | number
}

export interface QuestoesBulkReplace {
  questoes: QuestaoUpsert[]
}

export interface QuestaoOrdemItem {
  id: string
  ordem: number
}

export interface QuestoesReorder {
  ordens: QuestaoOrdemItem[]
}

export interface ArvorePasta {
  id: string
  nome: string
  avaliacoes: AvaliacaoListItem[]
}

export interface ArvoreAssunto {
  id: string
  nome: string
  ordem: number
  pastas: ArvorePasta[]
}

export interface ArvoreMateria {
  id: string
  nome: string
  assuntos: ArvoreAssunto[]
}

export interface AlunoAvaliacaoDisponivel {
  id: string
  titulo: string
  prazo_utc?: string | null
  status_submissao?: StatusSubmissao | null
}

export interface QuestaoAlunoView {
  id: string
  ordem: number
  tipo: TipoQuestao
  enunciado: string
  conteudo?: Record<string, unknown> | null
  alternativas?: string[] | null
}

export interface AlunoAvaliacaoView {
  id: string
  titulo: string
  prazo_utc?: string | null
  questoes: QuestaoAlunoView[]
  submissao_id?: string | null
}

export interface RespostaQuestaoInput {
  questao_id: string
  valor_texto?: string | null
  indice_selecionado?: number | null
}

export interface SubmissaoPatch {
  respostas: RespostaQuestaoInput[]
}

export interface SubmissaoResponse {
  id: string
  avaliacao_id: string
  status: StatusSubmissao
  nota_decimal?: string | number | null
  enviada_em?: string | null
}
