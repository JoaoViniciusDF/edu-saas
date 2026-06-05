"use client"

import { useQuery } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"

export default function ProfessoresConfigPage() {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: queryKeys.cadastros.professores(),
    queryFn: () => cadastrosRequests.listProfessores(),
  })

  return (
    <ListaCadastro
      titulo="Professores"
      itens={itens}
      carregando={isLoading}
      tipoWizard="professor"
      colunas={[
        { key: "nome", header: "Nome", render: (p) => p.nome_exibicao },
        { key: "email", header: "E-mail", render: (p) => p.email },
      ]}
    />
  )
}
