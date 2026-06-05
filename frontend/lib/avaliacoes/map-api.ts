import type { ArvoreMateria, MateriaResponse } from "@/lib/api/dtos/avaliacoes"
import type { MateriaAvaliacao } from "./tipos-ui"

const CORES = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
] as const

export function corUi(m?: MateriaResponse | null, index = 0): string {
  if (m?.cor_token_ui?.startsWith("from-")) return m.cor_token_ui
  return CORES[index % CORES.length]
}

export function arvoreParaMateria(arvore: ArvoreMateria, cor: string): MateriaAvaliacao {
  const assuntos = arvore.assuntos.map((a) => {
    const conteudos = a.pastas.map((p) => {
      const avaliacoes = p.avaliacoes.map((av) => ({
        id: av.id,
        titulo: av.titulo,
        status: av.status,
        alunosFeitos: av.total_submissoes ?? undefined,
        alunosTotal: av.total_alunos_turma ?? undefined,
      }))
      const totalSubmissoes = avaliacoes.reduce((acc, av) => acc + (av.alunosFeitos ?? 0), 0)
      const concluidas = avaliacoes.filter(
        (x) => x.status === "encerrada" || x.status === "publicada"
      ).length
      return {
        id: p.id,
        nome: p.nome,
        alunosResponderam: totalSubmissoes ?? undefined,
        alunosTotal: undefined,
        avaliacoesConcluidas: concluidas,
        avaliacoesTotal: avaliacoes.length,
        statusResumo:
          p.resumo_status_texto ??
          (p.avaliacoes.length
            ? `${avaliacoes.filter((x) => x.status === "rascunho").length} rascunho(s)`
            : "Sem avaliações ainda"),
        avaliacoes,
      }
    })
    return { id: a.id, nome: a.nome, conteudos }
  })
  const conteudosCount = assuntos.reduce((acc, a) => acc + a.conteudos.length, 0)
  return {
    id: arvore.id,
    nome: arvore.nome,
    cor,
    conteudosCount,
    assuntos,
  }
}

export function materiaVazia(m: MateriaResponse, cor: string): MateriaAvaliacao {
  return {
    id: m.id,
    nome: m.nome,
    cor,
    conteudosCount: 0,
    assuntos: [{ id: "_loading", nome: "Carregando...", conteudos: [] }],
  }
}
