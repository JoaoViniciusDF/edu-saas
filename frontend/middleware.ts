import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { TipoPerfil } from "@/lib/api/dtos/common"
import { COOKIE_ACCESS, perfilFromAccessToken } from "@/lib/api/session"
import { ehRotaPublica, ROTA_HOME_POR_PERFIL } from "@/lib/auth/rotas-por-perfil"
import { accessTokenNaoExpirado, accessTokenValido } from "@/lib/auth/validar-token"

const devLeve = process.env.NODE_ENV === "development"

async function tokenAceito(token: string | undefined): Promise<boolean> {
  if (devLeve) return accessTokenNaoExpirado(token)
  if (await accessTokenValido(token)) return true
  return accessTokenNaoExpirado(token)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_ACCESS)?.value

  if (ehRotaPublica(pathname)) {
    if (pathname === "/login" && (await tokenAceito(token))) {
      const perfil = (perfilFromAccessToken(token) ?? "professor") as TipoPerfil
      return NextResponse.redirect(new URL(ROTA_HOME_POR_PERFIL[perfil], request.url))
    }
    return NextResponse.next()
  }

  if (!(await tokenAceito(token))) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", pathname)
    const res = NextResponse.redirect(login)
    if (token) {
      res.cookies.delete(COOKIE_ACCESS)
      res.cookies.delete("edu_refresh")
    }
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
