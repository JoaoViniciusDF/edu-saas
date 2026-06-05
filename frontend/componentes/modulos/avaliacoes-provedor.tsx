"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { arvoreParaMateria, corUi, materiaVazia } from "@/lib/avaliacoes/map-api"
import { refetchArvoreMateria } from "@/lib/avaliacoes/cache-arvore"
import { useTurmaAtiva } from "@/componentes/provedores/provedor-turma-ativa"
import type {
  AssuntoAvaliacao,
  ConteudoAvaliacao,
  MateriaAvaliacao,
} from "@/lib/avaliacoes/tipos-ui"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function materiaIdFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean)
  const idx = parts.indexOf("avaliacoes")
  if (idx < 0) return null
  const id = parts[idx + 1]
  return id && UUID_RE.test(id) ? id : null
}

function buscarMateria(lista: MateriaAvaliacao[], materiaId: string) {
  return lista.find((m) => m.id === materiaId)
}

function buscarContextoRota(
  lista: MateriaAvaliacao[],
  materiaId: string,
  conteudoId: string
) {
  const materia = buscarMateria(lista, materiaId)
  if (!materia) return null
  for (const assunto of materia.assuntos) {
    if (assunto.id === "_loading") continue
    for (const conteudo of assunto.conteudos) {
      if (conteudo.id === conteudoId) {
        return { materia, assunto, conteudo }
      }
    }
  }
  return null
}

function buscarAvaliacao(
  lista: MateriaAvaliacao[],
  materiaId: string,
  conteudoId: string,
  avaliacaoId: string
) {
  const contexto = buscarContextoRota(lista, materiaId, conteudoId)
  if (!contexto) return null
  const avaliacao = contexto.conteudo.avaliacoes.find((a) => a.id === avaliacaoId)
  return avaliacao ? { ...contexto, avaliacao } : null
}

type AvaliacoesContextValue = {
  materias: MateriaAvaliacao[]
  carregando: boolean
  materiaAtivaCarregando: boolean
  recarregar: (materiaId?: string) => void
  invalidarArvore: (materiaId: string) => Promise<void>
  obterMateria: (materiaId: string) => MateriaAvaliacao | undefined
  obterContextoRota: (
    materiaId: string,
    conteudoId: string
  ) => ReturnType<typeof buscarContextoRota>
  obterAvaliacao: (
    materiaId: string,
    conteudoId: string,
    avaliacaoId: string
  ) => ReturnType<typeof buscarAvaliacao>
  adicionarMateria: (nome: string) => Promise<string>
  adicionarConteudoNoAssunto: (
    materiaId: string,
    assuntoId: string,
    nomePasta?: string
  ) => Promise<string | null>
  adicionarAssuntoNaMateria: (materiaId: string, nome: string) => Promise<string | null>
}

const AvaliacoesContext = React.createContext<AvaliacoesContextValue | null>(null)

export function ProvedorAvaliacoes({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const pathname = usePathname()
  const materiaAtivaId = materiaIdFromPath(pathname ?? "")
  const { turmaAtivaId } = useTurmaAtiva()

  const { data: listaMaterias = [], isLoading: loadingMaterias } = useQuery({
    queryKey: queryKeys.avaliacoes.materias(),
    queryFn: () => avaliacoesRequests.listMaterias(),
  })

  const indiceMateriaAtiva = React.useMemo(
    () => listaMaterias.findIndex((m) => m.id === materiaAtivaId),
    [listaMaterias, materiaAtivaId]
  )

  const { data: arvoreAtiva, isLoading: loadingArvoreAtiva, isFetching: fetchingArvore } =
    useQuery({
      queryKey: queryKeys.avaliacoes.arvore(materiaAtivaId ?? "__none__", turmaAtivaId),
      queryFn: async () => {
        const m = listaMaterias.find((x) => x.id === materiaAtivaId)
        const arvore = await avaliacoesRequests.getArvore(materiaAtivaId!, turmaAtivaId)
        return arvoreParaMateria(arvore, corUi(m ?? null, indiceMateriaAtiva >= 0 ? indiceMateriaAtiva : 0))
      },
      enabled: !!materiaAtivaId,
    })

  const invalidarArvore = React.useCallback(
    async (materiaId: string) => {
      const idx = listaMaterias.findIndex((m) => m.id === materiaId)
      const meta = listaMaterias[idx]
      await refetchArvoreMateria(qc, materiaId, meta, idx >= 0 ? idx : 0, turmaAtivaId)
    },
    [qc, listaMaterias, turmaAtivaId]
  )

  const recarregar = React.useCallback(
    (materiaId?: string) => {
      void qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.materias() })
      if (materiaId) void invalidarArvore(materiaId)
      else if (materiaAtivaId) void invalidarArvore(materiaAtivaId)
    },
    [qc, invalidarArvore, materiaAtivaId]
  )

  const materias = React.useMemo(() => {
    return listaMaterias.map((m, i) => {
      if (m.id === materiaAtivaId && arvoreAtiva) return arvoreAtiva
      const cached = qc.getQueryData<MateriaAvaliacao>(
        queryKeys.avaliacoes.arvore(m.id, turmaAtivaId)
      )
      if (cached) return cached
      return materiaVazia(m, corUi(m, i))
    })
  }, [listaMaterias, materiaAtivaId, arvoreAtiva, qc, turmaAtivaId])

  const adicionarMateria = React.useCallback(
    async (nome: string) => {
      const created = await avaliacoesRequests.createMateria({
        nome: nome.trim() || "Nova matéria",
        cor_token_ui: "from-blue-500 to-blue-600",
      })
      await avaliacoesRequests.createAssunto(created.id, { nome: "Geral" })
      await qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.materias() })
      const lista = await qc.fetchQuery({
        queryKey: queryKeys.avaliacoes.materias(),
        queryFn: () => avaliacoesRequests.listMaterias(),
      })
      const idx = lista.findIndex((m) => m.id === created.id)
      await refetchArvoreMateria(qc, created.id, created, idx >= 0 ? idx : 0, turmaAtivaId)
      return created.id
    },
    [qc]
  )

  const adicionarAssuntoNaMateria = React.useCallback(
    async (materiaId: string, nome: string) => {
      const created = await avaliacoesRequests.createAssunto(materiaId, {
        nome: nome.trim() || "Novo assunto",
      })
      await invalidarArvore(materiaId)
      return created.id
    },
    [invalidarArvore]
  )

  const adicionarConteudoNoAssunto = React.useCallback(
    async (materiaId: string, assuntoId: string, nomePasta?: string) => {
      await avaliacoesRequests.createPasta(assuntoId, {
        nome: nomePasta?.trim() || "Nova pasta de avaliações",
      })
      await invalidarArvore(materiaId)
      const arvore = await avaliacoesRequests.getArvore(materiaId, turmaAtivaId)
      const assunto = arvore.assuntos.find((a) => a.id === assuntoId)
      const pasta = assunto?.pastas.at(-1)
      return pasta?.id ?? null
    },
    [invalidarArvore]
  )

  const materiasRef = React.useRef(materias)
  React.useEffect(() => {
    materiasRef.current = materias
  }, [materias])

  const carregando = loadingMaterias
  const materiaAtivaCarregando =
    !!materiaAtivaId && (loadingArvoreAtiva || fetchingArvore) && !arvoreAtiva

  const value = React.useMemo<AvaliacoesContextValue>(
    () => ({
      materias,
      carregando,
      materiaAtivaCarregando,
      recarregar,
      invalidarArvore,
      obterMateria: (id) => buscarMateria(materiasRef.current, id),
      obterContextoRota: (mid, cid) => buscarContextoRota(materiasRef.current, mid, cid),
      obterAvaliacao: (mid, cid, aid) => buscarAvaliacao(materiasRef.current, mid, cid, aid),
      adicionarMateria,
      adicionarConteudoNoAssunto,
      adicionarAssuntoNaMateria,
    }),
    [
      materias,
      carregando,
      materiaAtivaCarregando,
      recarregar,
      invalidarArvore,
      adicionarMateria,
      adicionarConteudoNoAssunto,
      adicionarAssuntoNaMateria,
    ]
  )

  return <AvaliacoesContext.Provider value={value}>{children}</AvaliacoesContext.Provider>
}

export function useAvaliacoes() {
  const ctx = React.useContext(AvaliacoesContext)
  if (!ctx) {
    throw new Error("useAvaliacoes deve ser usado dentro de ProvedorAvaliacoes")
  }
  return ctx
}

export type { MateriaAvaliacao, AssuntoAvaliacao, ConteudoAvaliacao }
