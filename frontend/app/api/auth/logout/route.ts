import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import {
  COOKIE_ACCESS,
  COOKIE_IMPERSONATOR_ACCESS,
  COOKIE_IMPERSONATOR_REFRESH,
  COOKIE_REFRESH,
} from "@/lib/api/session"

export async function POST() {
  const jar = await cookies()
  const token = jar.get(COOKIE_ACCESS)?.value
  if (token) {
    try {
      await apiRequest<void>("/configuracoes/encerrar-sessao", {
        method: "POST",
        token,
      })
    } catch {
      /* ignore */
    }
  }
  jar.delete(COOKIE_ACCESS)
  jar.delete(COOKIE_REFRESH)
  jar.delete(COOKIE_IMPERSONATOR_ACCESS)
  jar.delete(COOKIE_IMPERSONATOR_REFRESH)
  return new NextResponse(null, { status: 204 })
}
