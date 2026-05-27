"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { cn } from "@/lib/utils"

const links = [
  { href: "/super-admin", label: "Resumo" },
  { href: "/super-admin/instituicoes", label: "Instituições" },
  { href: "/super-admin/professores", label: "Professores" },
  { href: "/super-admin/turmas", label: "Turmas" },
]

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { logout, usuario } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold">EduSaaS Super Admin</p>
            <p className="text-xs text-muted-foreground">{usuario?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>
      <nav className="flex gap-2 border-b border-border/50 px-6 py-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium",
              pathname === l.href || pathname.startsWith(`${l.href}/`)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
