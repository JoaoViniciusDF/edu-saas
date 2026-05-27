import type { ErrorEnvelope } from "./dtos/common"

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Record<string, unknown>

  constructor(status: number, envelope: ErrorEnvelope) {
    super(envelope.message)
    this.name = "ApiError"
    this.code = envelope.code
    this.status = status
    this.details = envelope.details
  }
}

export async function parseApiError(res: Response): Promise<ApiError> {
  let body: ErrorEnvelope = {
    code: "UNKNOWN",
    message: res.statusText || "Erro desconhecido",
  }
  try {
    const json = await res.json()
    if (json && typeof json.code === "string") {
      body = json as ErrorEnvelope
    } else if (json?.detail) {
      body = { code: "VALIDATION", message: String(json.detail) }
    }
  } catch {
    /* ignore */
  }
  return new ApiError(res.status, body)
}
