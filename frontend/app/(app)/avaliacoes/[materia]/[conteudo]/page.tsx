"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ModuloAvaliacoes } from "@/componentes/modulos/modulo-avaliacoes"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"

export default function AvaliacoesConteudoPage({
  params,
}: {
  params: Promise<{ materia: string; conteudo: string }>
}) {
  const { materia, conteudo } = use(params)
  const router = useRouter()
  const { obterContextoRota } = useAvaliacoes()
  const contextoExiste = Boolean(obterContextoRota(materia, conteudo))

  React.useEffect(() => {
    if (!contextoExiste) router.replace(`/avaliacoes/${materia}`)
  }, [contextoExiste, materia, router])

  if (!contextoExiste) return null

  return <ModuloAvaliacoes materiaId={materia} conteudoId={conteudo} />
}
