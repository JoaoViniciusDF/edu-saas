"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"

export default function ResponsaveisConfigPage() {
  const qc = useQueryClient()
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["cadastros", "responsaveis"],
    queryFn: () => cadastrosRequests.listResponsaveis(),
  })

  return (
    <ListaCadastro
      titulo="Responsáveis"
      itens={itens}
      carregando={isLoading}
      colunas={[
        { key: "nome", header: "Nome", render: (r) => r.nome_exibicao },
        { key: "email", header: "E-mail", render: (r) => r.email },
      ]}
      camposCriar={[
        { name: "nome_exibicao", label: "Nome" },
        { name: "email", label: "E-mail" },
        { name: "senha", label: "Senha", type: "password" },
      ]}
      onCriar={async (dados) => {
        await cadastrosRequests.createUsuario({
          tipo_perfil: "responsavel",
          nome_exibicao: dados.nome_exibicao,
          email: dados.email,
          senha: dados.senha,
        })
        void qc.invalidateQueries({ queryKey: ["cadastros", "responsaveis"] })
      }}
    />
  )
}
