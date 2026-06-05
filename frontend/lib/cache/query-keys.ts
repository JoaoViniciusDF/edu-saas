/** Registry central de query keys para invalidação e persistência. */
export const queryKeys = {
  conteudo: {
    pastas: (turmaId?: string | null, alunoId?: string | null) =>
      ["conteudo", "pastas", turmaId ?? null, alunoId ?? null] as const,
    materiais: (pastaId: string, alunoId?: string | null) =>
      ["conteudo", "materiais", pastaId, alunoId ?? null] as const,
  },
  comunicados: {
    lista: () => ["comunicados"] as const,
    detalhe: (id: string) => ["comunicados", id] as const,
    leituras: (id: string) => ["comunicados", "leituras", id] as const,
  },
  avaliacoes: {
    materias: () => ["avaliacoes", "materias"] as const,
    arvore: (materiaId: string, turmaId?: string | null) =>
      ["avaliacoes", "arvore", materiaId, turmaId ?? null] as const,
    detalhe: (id: string) => ["avaliacoes", "detalhe", id] as const,
    submissoes: (avaliacaoId: string) => ["avaliacoes", "submissoes", avaliacaoId] as const,
    submissaoAluno: (avaliacaoId: string, alunoId: string) =>
      ["avaliacoes", "submissao", avaliacaoId, alunoId] as const,
  },
  dashboard: {
    resumo: (params: unknown) => ["dashboard", "resumo", params] as const,
    series: (params: unknown) => ["dashboard", "series", params] as const,
    desempenhoAvaliacoes: (params: unknown) =>
      ["dashboard", "desempenho-avaliacoes", params] as const,
  },
  turmaAtiva: {
    todas: () => ["turma-ativa"] as const,
  },
  filhoAtivo: {
    todos: () => ["filho-ativo"] as const,
  },
  cadastros: {
    professores: () => ["cadastros", "professores"] as const,
    alunos: () => ["cadastros", "alunos"] as const,
    responsaveis: () => ["cadastros", "responsaveis"] as const,
    turmas: () => ["cadastros", "turmas"] as const,
  },
  turmas: {
    leitura: () => ["turmas", "leitura"] as const,
    resumo: () => ["turmas", "resumo"] as const,
  },
  notificacoes: () => ["notificacoes"] as const,
  aluno: {
    provas: () => ["aluno", "provas"] as const,
    prova: (id: string) => ["aluno", "prova", id] as const,
    provasDependente: (alunoId: string) => ["aluno", "provas", "dependente", alunoId] as const,
    provaDependente: (id: string, alunoId: string) =>
      ["aluno", "prova", "dependente", id, alunoId] as const,
  },
  superAdmin: {
    resumo: () => ["super-admin", "resumo"] as const,
    diretorio: (filtros: unknown) => ["super-admin", "diretorio", filtros] as const,
    instituicoes: () => ["super-admin", "instituicoes"] as const,
  },
} as const

/** Prefixos de query keys que podem ser persistidos em localStorage. */
export const QUERY_PREFIXOS_PERSISTIVEIS = [
  "auth",
  "conteudo",
  "comunicados",
  "avaliacoes",
  "cadastros",
  "turmas",
  "aluno",
  "turma-ativa",
  "filho-ativo",
] as const

export function queryDevePersistir(queryKey: readonly unknown[]): boolean {
  const root = queryKey[0]
  if (root === "auth" && queryKey[1] !== "me") return false
  if (root === "avaliacoes" && queryKey[1] === "arvore") return false
  if (root === "comunicados" && queryKey[1] !== undefined) return false
  if (root === "cadastros") return false
  if (root === "super-admin") return false
  return typeof root === "string" && QUERY_PREFIXOS_PERSISTIVEIS.includes(root as (typeof QUERY_PREFIXOS_PERSISTIVEIS)[number])
}
