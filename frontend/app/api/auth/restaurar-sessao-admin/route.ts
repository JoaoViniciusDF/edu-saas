import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import type { LoginResponse } from "@/lib/api/dtos/auth"
import { ApiError } from "@/lib/api/errors"
import {
  COOKIE_ACCESS,
  COOKIE_IMPERSONATOR_ACCESS,
  COOKIE_IMPERSONATOR_REFRESH,
  COOKIE_REFRESH,
  cookieOptions,
} from "@/lib/api/session"

export async function POST() {
  const jar = await cookies()
  const saRefresh = jar.get(COOKIE_IMPERSONATOR_REFRESH)?.value

  if (!saRefresh) {
    return NextResponse.json(
      { code: "NO_IMPERSONATOR", message: "Sessão de super admin não encontrada" },
      { status: 400 }
    )
  }

  try {
    const data = await apiRequest<LoginResponse>("/configuracoes/restaurar-sessao-admin", {
      method: "POST",
      body: { refresh_token: saRefresh },
    })

    jar.set(COOKIE_ACCESS, data.access_token, { ...cookieOptions, maxAge: 60 * 60 })
    jar.set(COOKIE_REFRESH, data.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    })
    jar.delete(COOKIE_IMPERSONATOR_ACCESS)
    jar.delete(COOKIE_IMPERSONATOR_REFRESH)

    return NextResponse.json({ usuario: data.usuario })
  } catch (e: unknown) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { code: e.code, message: e.message },
        { status: e.status }
      )
    }
    return NextResponse.json(
      { code: "RESTORE_FAILED", message: "Falha ao restaurar sessão" },
      { status: 500 }
    )
  }
}
