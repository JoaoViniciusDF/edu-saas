import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import type { LoginRequest, LoginResponse } from "@/lib/api/dtos/auth"
import { ApiError } from "@/lib/api/errors"
import { COOKIE_ACCESS, COOKIE_REFRESH, cookieOptions } from "@/lib/api/session"

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest
  try {
    const data = await apiRequest<LoginResponse>("/configuracoes/autenticar", {
      method: "POST",
      body,
    })
    const jar = await cookies()
    jar.set(COOKIE_ACCESS, data.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60,
    })
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
      { code: "LOGIN_FAILED", message: "Falha no login" },
      { status: 401 }
    )
  }
}
