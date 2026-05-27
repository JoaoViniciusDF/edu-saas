"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { configuracaoPermitida } from "@/lib/auth/rotas-por-perfil"
import { cn } from "@/lib/utils"

const TODAS_ABAS = [
  { href: "/configuracoes/instituicao", label: "Instituição", perfis: ["administrador"] as const },
  { href: "/configuracoes/professores", label: "Professores", perfis: ["administrador"] as const },
  { href: "/configuracoes/turmas", label: "Turmas", perfis: ["administrador", "professor"] as const },
  { href: "/configuracoes/alunos", label: "Alunos", perfis: ["administrador", "professor"] as const },
  { href: "/configuracoes/responsaveis", label: "Responsáveis", perfis: ["administrador", "professor"] as const },
]

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { usuario } = useAuth()
  const perfil = usuario?.perfil

  const abas = TODAS_ABAS.filter(
    (a) => perfil && a.perfis.includes(perfil as "administrador" | "professor")
  )

  if (perfil && !configuracaoPermitida(pathname, perfil)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Você não tem permissão para acessar esta seção.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/50 bg-card/50 px-6 py-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Cadastros da instituição</p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {abas.map((aba) => (
            <Link
              key={aba.href}
              href={aba.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(aba.href)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {aba.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  )
}
