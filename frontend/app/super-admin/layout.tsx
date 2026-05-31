"use client"

import type { ReactNode } from "react"
import { GraduationCap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/componentes/provedores/provedor-auth"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { logout, usuario } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border/50 bg-card/40 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-soft">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
              EduSaaS Super Admin
            </p>
            <p className="text-xs text-muted-foreground">{usuario?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  )
}
