export const COOKIE_ACCESS = "edu_access"
export const COOKIE_REFRESH = "edu_refresh"
export const COOKIE_IMPERSONATOR_ACCESS = "edu_impersonator_access"
export const COOKIE_IMPERSONATOR_REFRESH = "edu_impersonator_refresh"

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

const PERFIS_VALIDOS = new Set([
  "super_admin",
  "administrador",
  "professor",
  "aluno",
  "responsavel",
])

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    ) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Lê claim perfil do JWT (sem validar expiração). */
export function perfilFromAccessToken(token: string | undefined | null): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const perfil = payload?.perfil
  if (typeof perfil !== "string" || !PERFIS_VALIDOS.has(perfil)) return null
  return perfil
}

/** Lê claim impersonator_id do JWT (sem validar expiração). */
export function impersonatorIdFromAccessToken(token: string | undefined | null): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token) as { impersonator_id?: string } | null
  return payload?.impersonator_id ?? null
}

/** Sub (usuario_id) do JWT — usado para obter impersonator a partir do token SA em backup. */
export function subjectFromAccessToken(token: string | undefined | null): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token) as { sub?: string } | null
  return payload?.sub ?? null
}
