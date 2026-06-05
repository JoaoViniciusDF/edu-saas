"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import type { UserMe } from "@/lib/api/dtos/auth"
import { authRequests } from "@/lib/api/requests/configuracoes"
import { STALE_TIME_MS } from "@/lib/cache/query-config"
import {
  ROTA_HOME_POR_PERFIL,
  perfilEfetivo,
  rotaPermitidaParaPerfil,
} from "@/lib/auth/rotas-por-perfil"

type AuthContextValue = {
  usuario: UserMe | null
  carregando: boolean
  recarregar: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function ProvedorAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const qc = useQueryClient()

  const {
    data: usuario = null,
    isLoading,
    isFetching,
    isFetched,
    refetch,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authRequests.me(),
    staleTime: STALE_TIME_MS,
    retry: false,
    enabled: pathname !== "/login",
  })

  const carregando =
    pathname !== "/login" && !usuario && isLoading && !isFetched

  const recarregar = React.useCallback(async () => {
    const result = await refetch()
    return result.isSuccess
  }, [refetch])

  React.useEffect(() => {
    if (pathname === "/login" || isLoading || isFetching || !isFetched) return
    if (!usuario) {
      const login = new URL("/login", window.location.origin)
      login.searchParams.set("next", pathname)
      router.replace(login.pathname + login.search)
    }
  }, [usuario, pathname, isLoading, isFetching, isFetched, router])

  React.useEffect(() => {
    if (!usuario || pathname === "/login" || carregando) return
    const perfil = perfilEfetivo(usuario)
    if (!perfil || !rotaPermitidaParaPerfil(pathname, perfil)) {
      router.replace(ROTA_HOME_POR_PERFIL[perfil ?? usuario.perfil])
    }
  }, [usuario, pathname, carregando, router])

  const logout = React.useCallback(async () => {
    await authRequests.logout()
    qc.setQueryData(["auth", "me"], null)
    router.replace("/login")
  }, [router, qc])

  return (
    <AuthContext.Provider value={{ usuario, carregando, recarregar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de ProvedorAuth")
  }
  return ctx
}

function useClienteHidratado() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function GuardAuth({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { usuario, carregando } = useAuth()
  const pathname = usePathname()
  const hidratado = useClienteHidratado()

  if (pathname === "/login") return <>{children}</>

  if (!hidratado || carregando || !usuario) {
    const mensagem =
      hidratado && !carregando && !usuario ? "Redirecionando..." : "Carregando..."
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          {mensagem}
        </div>
      )
    )
  }

  return <>{children}</>
}
