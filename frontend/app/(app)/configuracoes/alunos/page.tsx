"use client"

import { useQuery } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"

export default function AlunosConfigPage() {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: queryKeys.cadastros.alunos(),
    queryFn: () => cadastrosRequests.listAlunos(),
  })

  return (
    <ListaCadastro
      titulo="Alunos"
      itens={itens}
      carregando={isLoading}
      tipoWizard="aluno"
      colunas={[
        { key: "nome", header: "Nome", render: (a) => a.nome_exibicao },
        { key: "email", header: "E-mail", render: (a) => a.email },
      ]}
    />
  )
}
