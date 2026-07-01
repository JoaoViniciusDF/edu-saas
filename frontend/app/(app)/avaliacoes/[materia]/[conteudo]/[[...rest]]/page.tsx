"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ModuloAvaliacoes } from "@/componentes/modulos/modulo-avaliacoes"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { Skeleton } from "@/components/ui/skeleton"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function AvaliacoesConteudoPage({
  params,
}: {
  params: Promise<{ materia: string; conteudo: string; rest?: string[] }>
}) {
  const { materia, conteudo, rest } = use(params)
  const avaliacao = rest?.[0]
  const router = useRouter()
  const { obterContextoRota, obterAvaliacao, carregando, materiaAtivaCarregando } = useAvaliacoes()
  const contextoExiste = Boolean(obterContextoRota(materia, conteudo))
  const aguardandoContexto = carregando || materiaAtivaCarregando

  const ehNova = avaliacao === "nova"
  const naArvore =
    !!avaliacao && (ehNova || Boolean(obterAvaliacao(materia, conteudo, avaliacao)))
  const idValido = !avaliacao || ehNova || UUID_RE.test(avaliacao)

  const { data: detalheApi, isLoading: loadingDetalhe, isError: erroDetalhe } = useQuery({
    queryKey: queryKeys.avaliacoes.detalhe(avaliacao ?? ""),
    queryFn: () => avaliacoesRequests.getAvaliacao(avaliacao!),
    enabled: !!avaliacao && idValido && !ehNova,
    retry: 1,
  })

  const podeRenderizarEditor =
    !avaliacao ||
    ehNova ||
    naArvore ||
    loadingDetalhe ||
    Boolean(detalheApi)

  React.useEffect(() => {
    if (aguardandoContexto) return
    if (rest && rest.length > 1) {
      router.replace(`/avaliacoes/${materia}/${conteudo}/${rest[0]}`)
    }
  }, [aguardandoContexto, rest, materia, conteudo, router])

  React.useEffect(() => {
    if (aguardandoContexto) return
    if (!contextoExiste) {
      router.replace(`/avaliacoes/${materia}`)
      return
    }
    if (!avaliacao) return
    if (ehNova) return
    if (!idValido) {
      router.replace(`/avaliacoes/${materia}/${conteudo}`)
      return
    }
    if (loadingDetalhe) return
    if (!naArvore && erroDetalhe && !detalheApi) {
      router.replace(`/avaliacoes/${materia}/${conteudo}`)
    }
  }, [
    aguardandoContexto,
    contextoExiste,
    materia,
    conteudo,
    avaliacao,
    ehNova,
    idValido,
    loadingDetalhe,
    naArvore,
    erroDetalhe,
    detalheApi,
    router,
  ])

  if (aguardandoContexto) {
    return avaliacao ? (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    ) : null
  }

  if (!contextoExiste) return null

  if (!avaliacao) {
    return <ModuloAvaliacoes materiaId={materia} conteudoId={conteudo} />
  }

  if (!podeRenderizarEditor) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <ModuloAvaliacoes
      materiaId={materia}
      conteudoId={conteudo}
      avaliacaoId={avaliacao}
    />
  )
}
