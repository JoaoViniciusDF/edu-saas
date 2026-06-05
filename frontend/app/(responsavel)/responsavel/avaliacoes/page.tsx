"use client"

import { ListaProvasAluno } from "@/componentes/aluno/lista-provas-aluno"
import { useFilhoAtivo } from "@/componentes/provedores/provedor-filho-ativo"
import { alunoAvaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"

export default function ResponsavelAvaliacoesPage() {
  const { alunoAtivoId } = useFilhoAtivo()
  if (!alunoAtivoId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Nenhum filho vinculado.
      </div>
    )
  }
  return (
    <ListaProvasAluno
      somenteLeitura
      queryKey={queryKeys.aluno.provasDependente(alunoAtivoId)}
      queryFn={() => alunoAvaliacoesRequests.disponiveisDependente(alunoAtivoId)}
      basePath="/responsavel/avaliacoes"
    />
  )
}
