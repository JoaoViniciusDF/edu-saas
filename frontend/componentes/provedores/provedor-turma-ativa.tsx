"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { leituraRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { useAuth } from "@/componentes/provedores/provedor-auth"

const STORAGE_KEY = "edu_turma_ativa_id"

type TurmaAtivaContextValue = {
  turmaAtivaId: string | null
  turmas: { id: string; nome: string }[]
  setTurmaAtivaId: (id: string) => void
  carregando: boolean
}

const TurmaAtivaContext = React.createContext<TurmaAtivaContextValue | null>(null)

export function ProvedorTurmaAtiva({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const ehProfessor = usuario?.perfil === "professor"

  const { data: turmasApi = [], isLoading } = useQuery({
    queryKey: queryKeys.turmas.resumo(),
    queryFn: () => leituraRequests.listTurmas(),
    enabled: ehProfessor,
    staleTime: 5 * 60 * 1000,
  })

  const turmas = React.useMemo(
    () => turmasApi.map((t) => ({ id: t.id, nome: t.nome })),
    [turmasApi]
  )

  const [turmaAtivaId, setTurmaAtivaIdState] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!ehProfessor || turmas.length === 0) return
    const salva = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    const valida = salva && turmas.some((t) => t.id === salva)
    setTurmaAtivaIdState(valida ? salva : turmas[0].id)
  }, [ehProfessor, turmas])

  const setTurmaAtivaId = React.useCallback(
    (id: string) => {
      setTurmaAtivaIdState(id)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, id)
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      void queryClient.invalidateQueries({ queryKey: ["conteudo"] })
      void queryClient.invalidateQueries({ queryKey: ["avaliacoes"] })
      void queryClient.invalidateQueries({ queryKey: ["comunicados"] })
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
    },
    [queryClient]
  )

  const value = React.useMemo(
    () => ({
      turmaAtivaId,
      turmas,
      setTurmaAtivaId,
      carregando: isLoading,
    }),
    [turmaAtivaId, turmas, setTurmaAtivaId, isLoading]
  )

  if (!ehProfessor) {
    return <>{children}</>
  }

  return (
    <TurmaAtivaContext.Provider value={value}>{children}</TurmaAtivaContext.Provider>
  )
}

export function useTurmaAtiva() {
  const ctx = React.useContext(TurmaAtivaContext)
  return (
    ctx ?? {
      turmaAtivaId: null,
      turmas: [],
      setTurmaAtivaId: () => {},
      carregando: false,
    }
  )
}
