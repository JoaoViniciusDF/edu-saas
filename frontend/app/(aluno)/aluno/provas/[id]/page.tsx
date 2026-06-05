"use client"

import { ResolverProva } from "@/componentes/modulos/resolver-prova"
import { alunoAvaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { use } from "react"

export default function AlunoProvaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <ResolverProva
      avaliacaoId={id}
      queryKey={queryKeys.aluno.prova(id)}
      queryFn={() => alunoAvaliacoesRequests.getView(id)}
      voltarPara="/aluno/provas"
    />
  )
}
