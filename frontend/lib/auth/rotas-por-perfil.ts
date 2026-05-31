import type { TipoPerfil } from "@/lib/api/dtos/common"
import type { UserMe } from "@/lib/api/dtos/auth"

export const ROTA_HOME_POR_PERFIL: Record<TipoPerfil, string> = {
  super_admin: "/super-admin",
  administrador: "/configuracoes",
  professor: "/conteudo",
  responsavel: "/dashboard",
  aluno: "/aluno/provas",
}

const PREFIXOS_APP = ["/conteudo", "/avaliacoes", "/comunicados", "/dashboard"]
const PREFIXOS_ALUNO = ["/aluno/"]
const PREFIXOS_SUPER = ["/super-admin"]
const PREFIXOS_CONFIG = ["/configuracoes"]

const CONFIG_APENAS_ADMIN = ["/configuracoes/professores", "/configuracoes/instituicao"]

export function perfilEfetivo(usuario: UserMe | null | undefined): TipoPerfil | undefined {
  return usuario?.perfil
}

export function configuracaoPermitida(pathname: string, perfil: TipoPerfil): boolean {
  if (!PREFIXOS_CONFIG.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false
  }
  if (perfil === "administrador") return true
  if (perfil === "professor") {
    return !CONFIG_APENAS_ADMIN.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  }
  return false
}

export function rotaPermitidaParaPerfil(pathname: string, perfil: TipoPerfil): boolean {
  if (pathname.startsWith("/login") || pathname.startsWith("/api/")) return true

  if (perfil === "super_admin") {
    return PREFIXOS_SUPER.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  if (perfil === "administrador") {
    const ped = PREFIXOS_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    const cfg = PREFIXOS_CONFIG.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    return ped || cfg
  }

  if (perfil === "professor") {
    const ped = PREFIXOS_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    return ped || configuracaoPermitida(pathname, perfil)
  }

  if (perfil === "aluno") {
    return PREFIXOS_ALUNO.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }

  if (perfil === "responsavel") {
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/comunicados" ||
      pathname.startsWith("/comunicados/")
    )
  }

  return false
}

export function ehRotaPublica(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/bff") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icon")
  )
}
