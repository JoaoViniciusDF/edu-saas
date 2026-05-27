"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { arvoreParaMateria, corUi, materiaVazia } from "@/lib/avaliacoes/map-api"
import type {
  AssuntoAvaliacao,
  ConteudoAvaliacao,
  MateriaAvaliacao,
} from "@/lib/avaliacoes/tipos-ui"

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
  recarregar: () => void
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
  const [arvores, setArvores] = React.useState<Record<string, MateriaAvaliacao>>({})

  const { data: listaMaterias = [], isLoading, refetch } = useQuery({
    queryKey: ["avaliacoes", "materias"],
    queryFn: () => avaliacoesRequests.listMaterias(),
  })

  React.useEffect(() => {
    listaMaterias.forEach((m, i) => {
      avaliacoesRequests.getArvore(m.id).then((arvore) => {
        setArvores((prev) => {
          if (prev[m.id]) return prev
          return { ...prev, [m.id]: arvoreParaMateria(arvore, corUi(m, i)) }
        })
      })
    })
  }, [listaMaterias])

  const materias = React.useMemo(() => {
    return listaMaterias.map((m, i) => arvores[m.id] ?? materiaVazia(m, corUi(m, i)))
  }, [listaMaterias, arvores])

  const invalidar = React.useCallback(
    async (materiaId?: string) => {
      await refetch()
      if (materiaId) {
        const m = listaMaterias.find((x) => x.id === materiaId)
        if (m) {
          const arvore = await avaliacoesRequests.getArvore(materiaId)
          const idx = listaMaterias.indexOf(m)
          setArvores((prev) => ({
            ...prev,
            [materiaId]: arvoreParaMateria(arvore, corUi(m, idx)),
          }))
        }
      }
    },
    [refetch, listaMaterias]
  )

  const adicionarMateria = React.useCallback(
    async (nome: string) => {
      const created = await avaliacoesRequests.createMateria({
        nome: nome.trim() || "Nova matéria",
        cor_token_ui: "from-blue-500 to-blue-600",
      })
      const arvore = await avaliacoesRequests.getArvore(created.id)
      setArvores((prev) => ({
        ...prev,
        [created.id]: arvoreParaMateria(arvore, corUi(created)),
      }))
      await qc.invalidateQueries({ queryKey: ["avaliacoes", "materias"] })
      return created.id
    },
    [qc]
  )

  const adicionarAssuntoNaMateria = React.useCallback(
    async (materiaId: string, nome: string) => {
      const created = await avaliacoesRequests.createAssunto(materiaId, {
        nome: nome.trim() || "Novo assunto",
      })
      await invalidar(materiaId)
      return created.id
    },
    [invalidar]
  )

  const adicionarConteudoNoAssunto = React.useCallback(
    async (materiaId: string, assuntoId: string, nomePasta?: string) => {
      const created = await avaliacoesRequests.createPasta(assuntoId, {
        nome: nomePasta?.trim() || "Nova pasta de avaliações",
      })
      await invalidar(materiaId)
      return created.id
    },
    [invalidar]
  )

  const materiasRef = React.useRef(materias)
  React.useEffect(() => {
    materiasRef.current = materias
  }, [materias])

  const value = React.useMemo<AvaliacoesContextValue>(
    () => ({
      materias,
      carregando: isLoading,
      recarregar: () => {
        void invalidar()
      },
      obterMateria: (id) => buscarMateria(materiasRef.current, id),
      obterContextoRota: (mid, cid) => buscarContextoRota(materiasRef.current, mid, cid),
      obterAvaliacao: (mid, cid, aid) => buscarAvaliacao(materiasRef.current, mid, cid, aid),
      adicionarMateria,
      adicionarConteudoNoAssunto,
      adicionarAssuntoNaMateria,
    }),
    [
      materias,
      isLoading,
      invalidar,
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

export type { MateriaAvaliacao, AssuntoAvaliacao, ConteudoAvaliacao, AvaliacaoListaItem }
