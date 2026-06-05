"use client"

import { useQuery } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"

export default function ResponsaveisConfigPage() {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: queryKeys.cadastros.responsaveis(),
    queryFn: () => cadastrosRequests.listResponsaveis(),
  })

  return (
    <ListaCadastro
      titulo="Responsáveis"
      itens={itens}
      carregando={isLoading}
      tipoWizard="responsavel"
      colunas={[
        { key: "nome", header: "Nome", render: (r) => r.nome_exibicao },
        { key: "email", header: "E-mail", render: (r) => r.email },
      ]}
    />
  )
}
