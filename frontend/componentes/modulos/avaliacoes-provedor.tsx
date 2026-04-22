"use client"

import * as React from "react"
import {
  dadosMaterias,
  type AssuntoAvaliacao,
  type ConteudoAvaliacao,
  type MateriaAvaliacao,
} from "@/lib/avaliacoes/dados"

function clonarMateriasIniciais(): MateriaAvaliacao[] {
  return JSON.parse(JSON.stringify(dadosMaterias)) as MateriaAvaliacao[]
}

function contarConteudos(materia: MateriaAvaliacao) {
  return materia.assuntos.reduce((acc, a) => acc + a.conteudos.length, 0)
}

function atualizarConteudosCount(lista: MateriaAvaliacao[]): MateriaAvaliacao[] {
  return lista.map((m) => ({
    ...m,
    conteudosCount: contarConteudos(m),
  }))
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

const CORES_MATERIA = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-rose-500 to-rose-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
] as const

type AvaliacoesContextValue = {
  materias: MateriaAvaliacao[]
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
  adicionarMateria: (nome: string) => string
  adicionarConteudoNoAssunto: (
    materiaId: string,
    assuntoId: string,
    nomePasta?: string
  ) => string | null
  adicionarAssuntoNaMateria: (materiaId: string, nome: string) => string | null
}

const AvaliacoesContext = React.createContext<AvaliacoesContextValue | null>(null)

export function ProvedorAvaliacoes({ children }: { children: React.ReactNode }) {
  const [materias, setMaterias] = React.useState<MateriaAvaliacao[]>(() =>
    atualizarConteudosCount(clonarMateriasIniciais())
  )
  const materiasRef = React.useRef(materias)
  React.useEffect(() => {
    materiasRef.current = materias
  }, [materias])

  const adicionarMateria = React.useCallback((nome: string) => {
    const id = `mat_${crypto.randomUUID()}`
    const assuntoId = `as_${crypto.randomUUID()}`
    const cor = CORES_MATERIA[Math.floor(Math.random() * CORES_MATERIA.length)]
    const nova: MateriaAvaliacao = {
      id,
      nome: nome.trim() || "Nova matéria",
      cor,
      conteudosCount: 0,
      assuntos: [
        {
          id: assuntoId,
          nome: "Geral",
          conteudos: [],
        },
      ],
    }
    setMaterias((prev) => atualizarConteudosCount([...prev, nova]))
    return id
  }, [])

  const adicionarAssuntoNaMateria = React.useCallback((materiaId: string, nome: string) => {
    const prev = materiasRef.current
    if (!buscarMateria(prev, materiaId)) return null

    const novoAssunto: AssuntoAvaliacao = {
      id: `as_${crypto.randomUUID()}`,
      nome: nome.trim() || "Novo conteúdo",
      conteudos: [],
    }

    setMaterias(
      atualizarConteudosCount(
        prev.map((m) =>
          m.id === materiaId ? { ...m, assuntos: [...m.assuntos, novoAssunto] } : m
        )
      )
    )
    return novoAssunto.id
  }, [])

  const adicionarConteudoNoAssunto = React.useCallback(
    (materiaId: string, assuntoId: string, nomePasta?: string) => {
      const prev = materiasRef.current
      const materia = buscarMateria(prev, materiaId)
      if (!materia?.assuntos.some((a) => a.id === assuntoId)) return null

      const novoId = crypto.randomUUID()
      const novoConteudo: ConteudoAvaliacao = {
        id: novoId,
        nome: nomePasta?.trim() || "Nova pasta de avaliações",
        alunosResponderam: 0,
        alunosTotal: 0,
        avaliacoesConcluidas: 0,
        avaliacoesTotal: 0,
        statusResumo: "Sem avaliações ainda",
        avaliacoes: [],
      }

      setMaterias(
        atualizarConteudosCount(
          prev.map((m) => {
            if (m.id !== materiaId) return m
            return {
              ...m,
              assuntos: m.assuntos.map((a) =>
                a.id === assuntoId
                  ? { ...a, conteudos: [...a.conteudos, novoConteudo] }
                  : a
              ),
            }
          })
        )
      )
      return novoId
    },
    []
  )

  const obterMateria = React.useCallback((materiaId: string) => {
    return buscarMateria(materiasRef.current, materiaId)
  }, [])

  const obterContextoRota = React.useCallback((materiaId: string, conteudoId: string) => {
    return buscarContextoRota(materiasRef.current, materiaId, conteudoId)
  }, [])

  const obterAvaliacao = React.useCallback(
    (materiaId: string, conteudoId: string, avaliacaoId: string) => {
      return buscarAvaliacao(materiasRef.current, materiaId, conteudoId, avaliacaoId)
    },
    []
  )

  const value = React.useMemo<AvaliacoesContextValue>(
    () => ({
      materias,
      obterMateria,
      obterContextoRota,
      obterAvaliacao,
      adicionarMateria,
      adicionarConteudoNoAssunto,
      adicionarAssuntoNaMateria,
    }),
    [
      materias,
      obterMateria,
      obterContextoRota,
      obterAvaliacao,
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
