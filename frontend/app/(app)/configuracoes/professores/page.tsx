"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"

export default function ProfessoresConfigPage() {
  const qc = useQueryClient()
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["cadastros", "professores"],
    queryFn: () => cadastrosRequests.listProfessores(),
  })

  return (
    <ListaCadastro
      titulo="Professores"
      itens={itens}
      carregando={isLoading}
      colunas={[
        { key: "nome", header: "Nome", render: (p) => p.nome_exibicao },
        { key: "email", header: "E-mail", render: (p) => p.email },
      ]}
      camposCriar={[
        { name: "nome_exibicao", label: "Nome" },
        { name: "email", label: "E-mail" },
        { name: "senha", label: "Senha", type: "password" },
      ]}
      onCriar={async (dados) => {
        await cadastrosRequests.createProfessor({
          nome_exibicao: dados.nome_exibicao,
          email: dados.email,
          senha: dados.senha,
        })
        void qc.invalidateQueries({ queryKey: ["cadastros", "professores"] })
      }}
    />
  )
}
