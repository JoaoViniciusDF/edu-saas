"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { useAuth } from "@/componentes/provedores/provedor-auth"

const STORAGE_KEY = "edu_filho_ativo_id"

type FilhoAtivoContextValue = {
  alunoAtivoId: string | null
  filhos: { id: string; nome: string }[]
  setAlunoAtivoId: (id: string) => void
  carregando: boolean
}

const FilhoAtivoContext = React.createContext<FilhoAtivoContextValue | null>(null)

export function ProvedorFilhoAtivo({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const ehResponsavel = usuario?.perfil === "responsavel"

  const { data: alunosApi = [], isLoading } = useQuery({
    queryKey: queryKeys.cadastros.alunos(),
    queryFn: () => cadastrosRequests.listAlunos(),
    enabled: ehResponsavel,
    staleTime: 5 * 60 * 1000,
  })

  const filhos = React.useMemo(
    () =>
      alunosApi.map((a) => ({
        id: a.id,
        nome: a.nome_exibicao,
      })),
    [alunosApi]
  )

  const [alunoAtivoId, setAlunoAtivoIdState] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!ehResponsavel || filhos.length === 0) return
    const salvo = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    const valido = salvo && filhos.some((f) => f.id === salvo)
    setAlunoAtivoIdState(valido ? salvo : filhos[0].id)
  }, [ehResponsavel, filhos])

  const setAlunoAtivoId = React.useCallback(
    (id: string) => {
      setAlunoAtivoIdState(id)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, id)
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      void queryClient.invalidateQueries({ queryKey: ["conteudo"] })
      void queryClient.invalidateQueries({ queryKey: ["aluno"] })
    },
    [queryClient]
  )

  const value = React.useMemo(
    () => ({
      alunoAtivoId,
      filhos,
      setAlunoAtivoId,
      carregando: isLoading,
    }),
    [alunoAtivoId, filhos, setAlunoAtivoId, isLoading]
  )

  if (!ehResponsavel) {
    return <>{children}</>
  }

  return (
    <FilhoAtivoContext.Provider value={value}>{children}</FilhoAtivoContext.Provider>
  )
}

export function useFilhoAtivo() {
  const ctx = React.useContext(FilhoAtivoContext)
  return (
    ctx ?? {
      alunoAtivoId: null,
      filhos: [],
      setAlunoAtivoId: () => {},
      carregando: false,
    }
  )
}
