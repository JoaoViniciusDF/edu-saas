import type { QueryClient } from "@tanstack/react-query"
import type { ArvoreMateria, AvaliacaoListItem, MateriaResponse } from "@/lib/api/dtos/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { arvoreParaMateria, corUi } from "@/lib/avaliacoes/map-api"
import type { MateriaAvaliacao } from "@/lib/avaliacoes/tipos-ui"

function aplicarAvaliacaoNaArvore(
  prev: MateriaAvaliacao | undefined,
  pastaId: string,
  avaliacao: Pick<AvaliacaoListItem, "id" | "titulo" | "status">
): MateriaAvaliacao | undefined {
  if (!prev) return prev
  const assuntos = prev.assuntos.map((assunto) => ({
    ...assunto,
    conteudos: assunto.conteudos.map((conteudo) => {
      if (conteudo.id !== pastaId) return conteudo
      const exists = conteudo.avaliacoes.some((a) => a.id === avaliacao.id)
      const avaliacoes = exists
        ? conteudo.avaliacoes.map((a) =>
            a.id === avaliacao.id
              ? {
                  id: avaliacao.id,
                  titulo: avaliacao.titulo,
                  status: avaliacao.status,
                }
              : a
          )
        : [
            ...conteudo.avaliacoes,
            {
              id: avaliacao.id,
              titulo: avaliacao.titulo,
              status: avaliacao.status,
            },
          ]
      return {
        ...conteudo,
        avaliacoes,
        avaliacoesTotal: avaliacoes.length,
      }
    }),
  }))
  return { ...prev, assuntos }
}

export function upsertAvaliacaoNaArvore(
  qc: QueryClient,
  materiaId: string,
  pastaId: string,
  avaliacao: Pick<AvaliacaoListItem, "id" | "titulo" | "status">,
  _cor: string,
  turmaId?: string | null
) {
  const patch = (prev: MateriaAvaliacao | undefined) =>
    aplicarAvaliacaoNaArvore(prev, pastaId, avaliacao)

  qc.setQueryData<MateriaAvaliacao>(
    queryKeys.avaliacoes.arvore(materiaId, turmaId ?? null),
    patch
  )
  if (turmaId) {
    qc.setQueryData<MateriaAvaliacao>(
      queryKeys.avaliacoes.arvore(materiaId, null),
      patch
    )
  }
}

export async function refetchArvoreMateria(
  qc: QueryClient,
  materiaId: string,
  materiaMeta?: MateriaResponse | null,
  index = 0,
  turmaId?: string | null
) {
  const arvore = await import("@/lib/api/requests/avaliacoes").then((m) =>
    m.avaliacoesRequests.getArvore(materiaId, turmaId)
  )
  const cor = corUi(materiaMeta ?? null, index)
  const ui = arvoreParaMateria(arvore, cor)
  qc.setQueryData(queryKeys.avaliacoes.arvore(materiaId, turmaId ?? null), ui)
  return ui
}

export function patchArvoreFromApi(
  qc: QueryClient,
  materiaId: string,
  arvore: ArvoreMateria,
  cor: string,
  turmaId?: string | null
) {
  qc.setQueryData(
    queryKeys.avaliacoes.arvore(materiaId, turmaId ?? null),
    arvoreParaMateria(arvore, cor)
  )
}
