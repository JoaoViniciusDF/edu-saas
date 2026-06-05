"use client"

import { ResolverProva } from "@/componentes/modulos/resolver-prova"
import { useFilhoAtivo } from "@/componentes/provedores/provedor-filho-ativo"
import { alunoAvaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { use } from "react"

export default function ResponsavelAvaliacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { alunoAtivoId } = useFilhoAtivo()
  if (!alunoAtivoId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Selecione um filho.
      </div>
    )
  }
  return (
    <ResolverProva
      avaliacaoId={id}
      queryKey={queryKeys.aluno.provaDependente(id, alunoAtivoId)}
      queryFn={() => alunoAvaliacoesRequests.getViewDependente(id, alunoAtivoId)}
      voltarPara="/responsavel/avaliacoes"
    />
  )
}
