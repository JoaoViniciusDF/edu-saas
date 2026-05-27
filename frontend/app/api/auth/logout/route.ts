import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/api/session"

export async function POST() {
  const jar = await cookies()
  const token = jar.get(COOKIE_ACCESS)?.value
  if (token) {
    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
        token,
      })
    } catch {
      /* ignore */
    }
  }
  jar.delete(COOKIE_ACCESS)
  jar.delete(COOKIE_REFRESH)
  return new NextResponse(null, { status: 204 })
}
