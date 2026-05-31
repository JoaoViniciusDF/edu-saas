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

/** Lê claim impersonator_id do JWT (sem validar expiração). */
export function impersonatorIdFromAccessToken(token: string | undefined | null): string | null {
  if (!token) return null
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    ) as { impersonator_id?: string; sub?: string }
    return payload.impersonator_id ?? null
  } catch {
    return null
  }
}

/** Sub (usuario_id) do JWT — usado para obter impersonator a partir do token SA em backup. */
export function subjectFromAccessToken(token: string | undefined | null): string | null {
  if (!token) return null
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    ) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}
