import { cookies } from "next/headers"
import { apiRequest } from "@/lib/api/client"
import {
  COOKIE_ACCESS,
  COOKIE_IMPERSONATOR_ACCESS,
  COOKIE_IMPERSONATOR_REFRESH,
  COOKIE_REFRESH,
  cookieOptions,
  impersonatorIdFromAccessToken,
  subjectFromAccessToken,
} from "@/lib/api/session"
import type { LoginResponse } from "@/lib/api/dtos/auth"

/**
 * Obtém o access token da sessão (cookie) renovando via refresh token quando
 * necessário. Compartilhado pelas rotas BFF (JSON e streaming).
 */
export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies()
  const accessCookie = jar.get(COOKIE_ACCESS)?.value ?? null
  if (accessCookie) return accessCookie
  const refresh = jar.get(COOKIE_REFRESH)?.value
  if (!refresh) return null
  let impersonatorId = impersonatorIdFromAccessToken(jar.get(COOKIE_ACCESS)?.value)
  if (!impersonatorId && jar.get(COOKIE_IMPERSONATOR_REFRESH)?.value) {
    impersonatorId = subjectFromAccessToken(jar.get(COOKIE_IMPERSONATOR_ACCESS)?.value)
  }
  try {
    const data = await apiRequest<LoginResponse>("/configuracoes/renovar-token", {
      method: "POST",
      body: {
        refresh_token: refresh,
        impersonator_id: impersonatorId ?? undefined,
      },
    })
    jar.set(COOKIE_ACCESS, data.access_token, { ...cookieOptions, maxAge: 60 * 60 })
    jar.set(COOKIE_REFRESH, data.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    })
    return data.access_token
  } catch {
    return null
  }
}
