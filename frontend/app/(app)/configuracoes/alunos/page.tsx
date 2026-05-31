"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"

export default function AlunosConfigPage() {
  const qc = useQueryClient()
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["cadastros", "alunos"],
    queryFn: () => cadastrosRequests.listAlunos(),
  })

  return (
    <ListaCadastro
      titulo="Alunos"
      itens={itens}
      carregando={isLoading}
      colunas={[
        { key: "nome", header: "Nome", render: (a) => a.nome_exibicao },
        { key: "email", header: "E-mail", render: (a) => a.email },
      ]}
      camposCriar={[
        { name: "nome_exibicao", label: "Nome" },
        { name: "email", label: "E-mail" },
        { name: "senha", label: "Senha", type: "password" },
      ]}
      onCriar={async (dados) => {
        await cadastrosRequests.createUsuario({
          tipo_perfil: "aluno",
          nome_exibicao: dados.nome_exibicao,
          email: dados.email,
          senha: dados.senha,
        })
        void qc.invalidateQueries({ queryKey: ["cadastros", "alunos"] })
      }}
    />
  )
}
