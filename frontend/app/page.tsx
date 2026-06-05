import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { TipoPerfil } from "@/lib/api/dtos/common"
import { COOKIE_ACCESS, perfilFromAccessToken } from "@/lib/api/session"
import { ROTA_HOME_POR_PERFIL } from "@/lib/auth/rotas-por-perfil"

export default async function HomePage() {
  const jar = await cookies()
  const token = jar.get(COOKIE_ACCESS)?.value
  if (!token) {
    redirect("/login")
  }
  const perfil = (perfilFromAccessToken(token) ?? "professor") as TipoPerfil
  redirect(ROTA_HOME_POR_PERFIL[perfil])
}
