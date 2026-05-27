"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ListaCadastro } from "@/componentes/configuracoes/lista-cadastro"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"

export default function TurmasConfigPage() {
  const qc = useQueryClient()
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["cadastros", "turmas"],
    queryFn: () => cadastrosRequests.listTurmas(),
  })

  return (
    <ListaCadastro
      titulo="Turmas"
      itens={itens}
      carregando={isLoading}
      colunas={[
        { key: "nome", header: "Nome", render: (t) => t.nome },
        { key: "ano", header: "Ano", render: (t) => t.ano_letivo },
        { key: "alunos", header: "Alunos", render: (t) => t.contagem_alunos ?? 0 },
      ]}
      camposCriar={[
        { name: "nome", label: "Nome da turma" },
        { name: "ano_letivo", label: "Ano letivo" },
      ]}
      onCriar={async (dados) => {
        await cadastrosRequests.createTurma({
          nome: dados.nome,
          ano_letivo: dados.ano_letivo,
        })
        void qc.invalidateQueries({ queryKey: ["cadastros", "turmas"] })
      }}
    />
  )
}
