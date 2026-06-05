"use client"

import { ModuloConteudo } from "@/componentes/modulos/modulo-conteudo"

export default function AlunoConteudoPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModuloConteudo somenteLeitura />
    </div>
  )
}
