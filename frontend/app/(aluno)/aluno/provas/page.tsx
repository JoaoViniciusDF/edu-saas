"use client"

import { ListaProvasAluno } from "@/componentes/aluno/lista-provas-aluno"
import { alunoAvaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"

export default function AlunoProvasPage() {
  return (
    <ListaProvasAluno
      queryKey={queryKeys.aluno.provas()}
      queryFn={() => alunoAvaliacoesRequests.disponiveis()}
      basePath="/aluno/provas"
    />
  )
}
