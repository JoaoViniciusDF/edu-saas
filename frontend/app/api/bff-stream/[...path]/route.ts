import { NextRequest, NextResponse } from "next/server"
import { API_BASE } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/server-session"

// Necessário para encaminhar SSE: nada de cache/estático.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Proxy de streaming (SSE) para o backend. Diferente de /api/bff (que
 * bufferiza JSON), esta rota repassa o corpo do upstream como stream para
 * suportar Server-Sent Events em tempo real.
 */
async function proxyStream(req: NextRequest, pathSegments: string[]) {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Não autenticado" },
      { status: 401 }
    )
  }

  const path = `/${pathSegments.join("/")}`
  const search = req.nextUrl.search
  const url = `${API_BASE}${path}${search}`

  let body: string | undefined
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text()
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  if (!upstream.ok || !upstream.body) {
    const texto = await upstream.text().catch(() => "")
    return NextResponse.json(
      { code: "ERROR", message: texto || "Falha no streaming" },
      { status: upstream.status || 500 }
    )
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  return proxyStream(req, path)
}
