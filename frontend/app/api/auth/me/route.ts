import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import type { UserMe } from "@/lib/api/dtos/auth"
import { ApiError } from "@/lib/api/errors"
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/api/session"

function clearAuthCookies(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.delete(COOKIE_ACCESS)
  jar.delete(COOKIE_REFRESH)
}

export async function GET() {
  const jar = await cookies()
  const token = jar.get(COOKIE_ACCESS)?.value
  if (!token) {
    clearAuthCookies(jar)
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Não autenticado" },
      { status: 401 }
    )
  }
  try {
    const me = await apiRequest<UserMe>("/configuracoes/consultar-perfil", { token })
    return NextResponse.json(me)
  } catch (e: unknown) {
    clearAuthCookies(jar)
    if (e instanceof ApiError) {
      return NextResponse.json(
        { code: e.code, message: e.message },
        { status: e.status }
      )
    }
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sessão inválida" },
      { status: 401 }
    )
  }
}
