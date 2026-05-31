import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/client"
import { parseApiError } from "@/lib/api/errors"
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

async function getAccessToken(): Promise<string | null> {
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
