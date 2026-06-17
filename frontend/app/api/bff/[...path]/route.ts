import { NextRequest, NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/server-session"

async function proxy(req: NextRequest, pathSegments: string[]) {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Não autenticado" }, { status: 401 })
  }

  const path = `/${pathSegments.join("/")}`
  const search = req.nextUrl.search
  const method = req.method
  let body: unknown = undefined
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await req.json()
    } catch {
      body = undefined
    }
  }

  try {
    const data = await apiRequest<unknown>(`${path}${search}`, {
      method,
      body,
      token,
    })
    if (data === undefined) return new NextResponse(null, { status: 204 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    const err = e as { status?: number; code?: string; message?: string; details?: Record<string, unknown> }
    return NextResponse.json(
      {
        code: err.code ?? "ERROR",
        message: err.message ?? "Erro",
        details: err.details,
      },
      { status: err.status ?? 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  return proxy(req, path)
}
