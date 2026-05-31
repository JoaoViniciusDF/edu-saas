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

export async function POST(request: Request) {
  const body = (await request.json()) as { usuario_id: string }
  const jar = await cookies()
  const saAccess = jar.get(COOKIE_ACCESS)?.value
  const saRefresh = jar.get(COOKIE_REFRESH)?.value

  if (!saAccess) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Não autenticado" },
      { status: 401 }
    )
  }

  try {
    const data = await apiRequest<LoginResponse>(
      `/configuracoes/assumir-sessao/${body.usuario_id}`,
      { method: "POST", token: saAccess }
    )

    if (saAccess && saRefresh) {
      jar.set(COOKIE_IMPERSONATOR_ACCESS, saAccess, { ...cookieOptions, maxAge: 60 * 60 })
      jar.set(COOKIE_IMPERSONATOR_REFRESH, saRefresh, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    jar.set(COOKIE_ACCESS, data.access_token, { ...cookieOptions, maxAge: 60 * 60 })
    jar.set(COOKIE_REFRESH, data.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({ usuario: data.usuario })
  } catch (e: unknown) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { code: e.code, message: e.message },
        { status: e.status }
      )
    }
    return NextResponse.json(
      { code: "IMPERSONATE_FAILED", message: "Falha ao assumir sessão" },
      { status: 500 }
    )
  }
}
