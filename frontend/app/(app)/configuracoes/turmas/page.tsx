"use client"

import { useQuery } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"

export default function TurmasConfigPage() {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: queryKeys.cadastros.turmas(),
    queryFn: () => cadastrosRequests.listTurmas(),
  })

  return (
    <ListaCadastro
      titulo="Turmas"
      itens={itens}
      carregando={isLoading}
      tipoWizard="turma"
      mostrarGerenciarTurma
      colunas={[
        { key: "nome", header: "Nome", render: (t) => t.nome },
        { key: "ano", header: "Ano", render: (t) => t.ano_letivo },
        { key: "alunos", header: "Alunos", render: (t) => t.contagem_alunos ?? 0 },
      ]}
    />
  )
}
