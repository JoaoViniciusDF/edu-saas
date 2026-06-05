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

export default function AvaliacaoEditorPage({
  params,
}: {
  params: Promise<{ materia: string; conteudo: string; avaliacao: string }>
}) {
  const { materia, conteudo, avaliacao } = use(params)
  const router = useRouter()
  const { obterContextoRota, obterAvaliacao, carregando, materiaAtivaCarregando } = useAvaliacoes()
  const ehNova = avaliacao === "nova"
  const contextoExiste = Boolean(obterContextoRota(materia, conteudo))
  const naArvore = ehNova || Boolean(obterAvaliacao(materia, conteudo, avaliacao))
  const idValido = ehNova || UUID_RE.test(avaliacao)

  const { data: detalheApi, isLoading: loadingDetalhe, isError: erroDetalhe } = useQuery({
    queryKey: queryKeys.avaliacoes.detalhe(avaliacao),
    queryFn: () => avaliacoesRequests.getAvaliacao(avaliacao),
    enabled: idValido && !ehNova,
    retry: 1,
  })

  const aguardandoContexto = carregando || materiaAtivaCarregando
  const podeRenderizar =
    ehNova ||
    naArvore ||
    loadingDetalhe ||
    Boolean(detalheApi)

  React.useEffect(() => {
    if (aguardandoContexto) return
    if (ehNova) return
    if (!contextoExiste) {
      router.replace(`/avaliacoes/${materia}`)
      return
    }
    if (!idValido) {
      router.replace(`/avaliacoes/${materia}/${conteudo}`)
      return
    }
    if (loadingDetalhe) return
    if (!naArvore && erroDetalhe && !detalheApi) {
      router.replace(`/avaliacoes/${materia}/${conteudo}`)
    }
  }, [
    contextoExiste,
    naArvore,
    aguardandoContexto,
    materia,
    conteudo,
    avaliacao,
    router,
    idValido,
    loadingDetalhe,
    erroDetalhe,
    detalheApi,
    ehNova,
  ])

  if (aguardandoContexto || !podeRenderizar) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (!ehNova && !contextoExiste) return null

  return (
    <ModuloAvaliacoes
      materiaId={materia}
      conteudoId={conteudo}
      avaliacaoId={avaliacao}
    />
  )
}
