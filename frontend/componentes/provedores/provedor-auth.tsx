"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import type { UserMe } from "@/lib/api/dtos/auth"
import { authRequests } from "@/lib/api/requests/configuracoes"
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
  const [usuario, setUsuario] = React.useState<UserMe | null>(null)
  const [carregando, setCarregando] = React.useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const encerrarSessao = React.useCallback(async () => {
    try {
      await authRequests.logout()
    } catch {
      /* cookies limpos no servidor */
    }
    setUsuario(null)
  }, [])

  const recarregar = React.useCallback(async () => {
    try {
      const me = await authRequests.me()
      setUsuario(me)
      return true
    } catch {
      setUsuario(null)
      return false
    }
  }, [])

  React.useEffect(() => {
    if (pathname === "/login") {
      setCarregando(false)
      return
    }
    setCarregando(true)
    void (async () => {
      const ok = await recarregar()
      setCarregando(false)
      if (!ok) {
        await encerrarSessao()
        const login = new URL("/login", window.location.origin)
        login.searchParams.set("next", pathname)
        router.replace(login.pathname + login.search)
      }
    })()
  }, [pathname, recarregar, encerrarSessao, router])

  React.useEffect(() => {
    if (!usuario || pathname === "/login" || carregando) return
    const perfil = perfilEfetivo(usuario)
    if (!perfil || !rotaPermitidaParaPerfil(pathname, perfil)) {
      router.replace(ROTA_HOME_POR_PERFIL[perfil ?? usuario.perfil])
    }
  }, [usuario, pathname, carregando, router])

  const logout = React.useCallback(async () => {
    await authRequests.logout()
    setUsuario(null)
    router.replace("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ usuario, carregando, recarregar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve estar dentro de ProvedorAuth")
  return ctx
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

  if (pathname === "/login") return <>{children}</>
  if (carregando) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Carregando...
        </div>
      )
    )
  }
  if (!usuario) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Redirecionando...
        </div>
      )
    )
  }
  return <>{children}</>
}
