"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ModuloAvaliacoes } from "@/componentes/modulos/modulo-avaliacoes"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"

export default function AvaliacaoEditorPage({
  params,
}: {
  params: Promise<{ materia: string; conteudo: string; avaliacao: string }>
}) {
  const { materia, conteudo, avaliacao } = use(params)
  const router = useRouter()
  const { obterContextoRota, obterAvaliacao } = useAvaliacoes()
  const contextoExiste = Boolean(obterContextoRota(materia, conteudo))
  const avaliacaoExiste = avaliacao === "nova" || Boolean(obterAvaliacao(materia, conteudo, avaliacao))

  React.useEffect(() => {
    if (!contextoExiste) {
      router.replace(`/avaliacoes/${materia}`)
      return
    }
    if (!avaliacaoExiste) {
      router.replace(`/avaliacoes/${materia}/${conteudo}`)
    }
  }, [contextoExiste, avaliacaoExiste, materia, conteudo, router])

  if (!contextoExiste || !avaliacaoExiste) return null

  return (
    <ModuloAvaliacoes
      materiaId={materia}
      conteudoId={conteudo}
      avaliacaoId={avaliacao}
    />
  )
}
