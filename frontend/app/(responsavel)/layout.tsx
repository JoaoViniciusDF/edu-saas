"use client"

import type { ReactNode } from "react"
import { BarraLateral } from "@/componentes/layout/barra-lateral"
import { Cabecalho } from "@/componentes/layout/cabecalho"
import { ProvedorFilhoAtivo } from "@/componentes/provedores/provedor-filho-ativo"

export default function ResponsavelLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ProvedorFilhoAtivo>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="relative z-40 shrink-0">
          <BarraLateral />
        </div>
        <div className="relative z-0 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <Cabecalho />
          </div>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-16 lg:pt-0">
            {children}
          </main>
        </div>
      </div>
    </ProvedorFilhoAtivo>
  )
}
