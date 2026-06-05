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
  const { obterContextoRota, carregando, materiaAtivaCarregando } = useAvaliacoes()
  const contextoExiste = Boolean(obterContextoRota(materia, conteudo))

  React.useEffect(() => {
    if (carregando || materiaAtivaCarregando) return
    if (!contextoExiste) router.replace(`/avaliacoes/${materia}`)
  }, [contextoExiste, carregando, materiaAtivaCarregando, materia, router])

  if (carregando || materiaAtivaCarregando) return null
  if (!contextoExiste) return null

  return <ModuloAvaliacoes materiaId={materia} conteudoId={conteudo} />
}
