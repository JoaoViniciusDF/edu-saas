"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserMe } from "@/lib/api/dtos/auth"
import { ROTA_HOME_POR_PERFIL } from "@/lib/auth/rotas-por-perfil"

const IS_DEV = process.env.NODE_ENV === "development"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [email, setEmail] = React.useState(IS_DEV ? "professor@demo.edusaas" : "")
  const [senha, setSenha] = React.useState(IS_DEV ? "Demo@2026" : "")
  const [erro, setErro] = React.useState<string | null>(null)
  const [enviando, setEnviando] = React.useState(false)
  const [mostrarDemo, setMostrarDemo] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.message ?? "Credenciais inválidas")
        return
      }
      const usuario = data.usuario as UserMe
      qc.setQueryData(["auth", "me"], usuario)
      const next = searchParams.get("next")
      const destino =
        next && !next.startsWith("/login")
          ? next
          : ROTA_HOME_POR_PERFIL[usuario.perfil]
      router.replace(destino)
      router.refresh()
    } catch {
      setErro("Não foi possível conectar ao servidor")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            EduSaaS
          </CardTitle>
          <CardDescription>Entre com seu e-mail institucional</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            {erro && (
              <p className="text-sm text-destructive" role="alert">
                {erro}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
          {IS_DEV && (
          <button
            type="button"
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMostrarDemo((v) => !v)}
          >
            {mostrarDemo ? "Ocultar" : "Ver"} credenciais demo
          </button>
          )}
          {IS_DEV && mostrarDemo && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>professor@demo.edusaas — Demo@2026</li>
              <li>admin@demo.edusaas — Demo@2026</li>
              <li>aluno@demo.edusaas — Demo@2026</li>
              <li>responsavel@demo.edusaas — Demo@2026</li>
              <li>super@edusaas.local — Demo@2026</li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
