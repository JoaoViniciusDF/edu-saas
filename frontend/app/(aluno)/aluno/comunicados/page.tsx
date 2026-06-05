"use client"

import { ModuloComunicados } from "@/componentes/modulos/modulo-comunicados"

export default function AlunoComunicadosPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModuloComunicados somenteLeitura />
    </div>
  )
}
