import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import type { LoginResponse } from "@/lib/api/dtos/auth"
import { COOKIE_ACCESS, COOKIE_REFRESH, cookieOptions } from "@/lib/api/session"

export async function POST() {
  const jar = await cookies()
  const refresh = jar.get(COOKIE_REFRESH)?.value
  if (!refresh) {
    return NextResponse.json({ code: "NO_REFRESH" }, { status: 401 })
  }
  try {
    const data = await apiRequest<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refresh },
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
    return NextResponse.json({ code: "REFRESH_FAILED" }, { status: 401 })
  }
}
