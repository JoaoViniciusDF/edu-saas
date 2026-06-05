import type { ReactNode } from "react"
import { ProvedorAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"

export default function AvaliacoesMateriaLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <ProvedorAvaliacoes>{children}</ProvedorAvaliacoes>
}
