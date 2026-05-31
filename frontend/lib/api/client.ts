import { parseApiError } from "./errors"

/** Server-side (BFF/auth): use API_URL no Docker (ex.: http://backend:8000). */
const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000"

export type RequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  token?: string | null
  searchParams?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`
  if (!searchParams) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, token, searchParams } = options
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  }
  if (token) {
    init.headers = { ...init.headers, Authorization: `Bearer ${token}` }
  }
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    init.body = JSON.stringify(body)
  }
  const res = await fetch(buildUrl(path, searchParams), init)
  if (res.status === 204) return undefined as T
  if (!res.ok) throw await parseApiError(res)
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

/** Cliente browser: usa BFF `/api/bff` que injeta cookie de sessão. */
export async function bffRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, searchParams } = options
  const params = new URLSearchParams()
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
    }
  }
  const qs = params.toString()
  const url = `/api/bff${path.startsWith("/") ? path : `/${path}`}${qs ? `?${qs}` : ""}`
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  }
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    init.body = JSON.stringify(body)
  }
  const res = await fetch(url, init)
  if (res.status === 204) return undefined as T
  if (!res.ok) throw await parseApiError(res)
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export { API_BASE }
