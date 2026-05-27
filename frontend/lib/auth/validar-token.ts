import { decodeJwt, jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? "change-me-in-production-edusaas-dev"

function secretKey() {
  return new TextEncoder().encode(JWT_SECRET)
}

/** Valida assinatura e expiração do access token (sem consultar DB). */
export async function accessTokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] })
    if (payload.type !== "access") return false
    return true
  } catch {
    return false
  }
}

/** Verifica expiração sem validar assinatura (fallback se secret divergir). */
export function accessTokenNaoExpirado(token: string | undefined): boolean {
  if (!token) return false
  try {
    const payload = decodeJwt(token)
    if (payload.type !== "access") return false
    const exp = payload.exp
    if (typeof exp !== "number") return false
    return exp * 1000 > Date.now()
  } catch {
    return false
  }
}
