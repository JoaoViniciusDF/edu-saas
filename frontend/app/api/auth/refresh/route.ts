import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import type { LoginResponse } from "@/lib/api/dtos/auth"
import {
  COOKIE_ACCESS,
  COOKIE_IMPERSONATOR_ACCESS,
  COOKIE_IMPERSONATOR_REFRESH,
  COOKIE_REFRESH,
  cookieOptions,
  impersonatorIdFromAccessToken,
} from "@/lib/api/session"

export async function POST() {
  const jar = await cookies()
  const access = jar.get(COOKIE_ACCESS)?.value
  const refresh = jar.get(COOKIE_REFRESH)?.value
  if (!refresh) {
    return NextResponse.json({ code: "NO_REFRESH" }, { status: 401 })
  }
  const impersonatorId = impersonatorIdFromAccessToken(access)
  try {
    const data = await apiRequest<LoginResponse>("/configuracoes/renovar-token", {
      method: "POST",
      body: {
        refresh_token: refresh,
        impersonator_id: impersonatorId ?? undefined,
      },
    })
    jar.set(COOKIE_ACCESS, data.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60,
    })
    jar.set(COOKIE_REFRESH, data.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    })
    return NextResponse.json({ usuario: data.usuario })
  } catch {
    jar.delete(COOKIE_ACCESS)
    jar.delete(COOKIE_REFRESH)
    jar.delete(COOKIE_IMPERSONATOR_ACCESS)
    jar.delete(COOKIE_IMPERSONATOR_REFRESH)
    return NextResponse.json({ code: "REFRESH_FAILED" }, { status: 401 })
  }
}
