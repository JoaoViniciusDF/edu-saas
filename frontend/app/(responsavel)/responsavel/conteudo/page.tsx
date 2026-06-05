"use client"

import { ModuloConteudo } from "@/componentes/modulos/modulo-conteudo"
import { useFilhoAtivo } from "@/componentes/provedores/provedor-filho-ativo"

export default function ResponsavelConteudoPage() {
  const { alunoAtivoId } = useFilhoAtivo()
  if (!alunoAtivoId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Nenhum filho vinculado.
      </div>
    )
  }
  return <ModuloConteudo somenteLeitura alunoId={alunoAtivoId} />
}
