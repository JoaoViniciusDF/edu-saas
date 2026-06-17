"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Send, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { RenderizadorDocumento } from "@/componentes/avaliacoes/renderizador-documento"
import { VisualizadorGabarito } from "@/componentes/aluno/visualizador-gabarito"
import { NavegacaoPaginas } from "@/componentes/shared/navegacao-paginas"
import type { DocumentoJson } from "@/lib/avaliacoes/documento"
import type { AlunoAvaliacaoView, SubmissaoResponse } from "@/lib/api/dtos/avaliacoes"
import { ApiError } from "@/lib/api/errors"

const MSG_SAIR =
  "Você precisa finalizar e enviar a prova antes de sair desta página."

export function ResolverProva({
  avaliacaoId,
  queryKey,
  queryFn,
  voltarPara,
}: {
  avaliacaoId: string
  queryKey: readonly unknown[]
  queryFn: () => Promise<AlunoAvaliacaoView>
  voltarPara: string
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const [submissaoId, setSubmissaoId] = React.useState<string | null>(null)
  const [respostas, setRespostas] = React.useState<
    Record<string, { indice?: number; texto?: string }>
  >({})
  const [enviando, setEnviando] = React.useState(false)
  const [iniciando, setIniciando] = React.useState(false)
  const [resultadoEnvio, setResultadoEnvio] = React.useState<SubmissaoResponse | null>(null)
  const [paginaQuestao, setPaginaQuestao] = React.useState(0)
  const iniciouSubmissaoRef = React.useRef(false)

  const { data: view, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn,
  })

  const somenteLeitura = view?.somente_leitura ?? false
  const emProva = !somenteLeitura && !resultadoEnvio
  const totalQuestoes = view?.questoes.length ?? 0

  React.useEffect(() => {
    if (view?.submissao_id) setSubmissaoId(view.submissao_id)
  }, [view?.submissao_id])

  React.useEffect(() => {
    if (!view?.respostas?.length) return
    const mapa: Record<string, { indice?: number; texto?: string }> = {}
    for (const r of view.respostas) {
      mapa[r.questao_id] = {
        indice: r.indice_selecionado ?? undefined,
        texto: r.valor_texto ?? undefined,
      }
    }
    setRespostas(mapa)
  }, [view?.respostas])

  React.useEffect(() => {
    setPaginaQuestao(0)
    iniciouSubmissaoRef.current = false
    // Troca de prova (ou de aluno impersonado) zera o estado local para não
    // reaproveitar a submissão de outra avaliação/aluno.
    setSubmissaoId(null)
    setRespostas({})
    setResultadoEnvio(null)
  }, [avaliacaoId])

  React.useEffect(() => {
    if (!emProva || somenteLeitura || !view || submissaoId || iniciouSubmissaoRef.current) return
    iniciouSubmissaoRef.current = true
    let cancelado = false

    const iniciar = async () => {
      setIniciando(true)
      try {
        const { alunoAvaliacoesRequests } = await import("@/lib/api/requests/avaliacoes")
        const sub = await alunoAvaliacoesRequests.createSubmissao(avaliacaoId)
        if (!cancelado) setSubmissaoId(sub.id)
      } catch {
        iniciouSubmissaoRef.current = false
        void refetch()
      } finally {
        if (!cancelado) setIniciando(false)
      }
    }

    void iniciar()
    return () => {
      cancelado = true
    }
  }, [emProva, somenteLeitura, view, submissaoId, avaliacaoId, refetch])

  React.useEffect(() => {
    if (!emProva) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = MSG_SAIR
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [emProva])

  // Cria (ou recupera, pois o backend é idempotente) a submissão deste aluno.
  // `forcar` ignora o id em memória — usado para se recuperar de um id obsoleto
  // que resultaria em 404.
  const garantirSubmissao = async (forcar = false): Promise<string | null> => {
    if (somenteLeitura) return null
    if (submissaoId && !forcar) return submissaoId
    const { alunoAvaliacoesRequests } = await import("@/lib/api/requests/avaliacoes")
    const sub = await alunoAvaliacoesRequests.createSubmissao(avaliacaoId)
    setSubmissaoId(sub.id)
    return sub.id
  }

  const corpoRespostas = () => ({
    respostas: (view?.questoes ?? []).map((q) => ({
      questao_id: q.id,
      valor_texto: respostas[q.id]?.texto ?? null,
      indice_selecionado: respostas[q.id]?.indice ?? null,
    })),
  })

  const salvarRespostas = async (): Promise<string | null> => {
    if (somenteLeitura || !view) return null
    const { alunoAvaliacoesRequests } = await import("@/lib/api/requests/avaliacoes")
    const corpo = corpoRespostas()
    let sid = await garantirSubmissao()
    if (!sid) return null
    try {
      await alunoAvaliacoesRequests.patchSubmissao(sid, corpo)
    } catch (e) {
      // Id de submissão obsoleto (ex.: cache de outra sessão): recria e tenta de novo.
      if (e instanceof ApiError && e.status === 404) {
        sid = await garantirSubmissao(true)
        if (!sid) return null
        await alunoAvaliacoesRequests.patchSubmissao(sid, corpo)
      } else {
        throw e
      }
    }
    return sid
  }

  const enviar = async () => {
    if (somenteLeitura) return
    setEnviando(true)
    try {
      const { alunoAvaliacoesRequests } = await import("@/lib/api/requests/avaliacoes")
      let sid = (await salvarRespostas()) ?? (await garantirSubmissao())
      if (!sid) return
      try {
        const res = await alunoAvaliacoesRequests.enviarSubmissao(sid)
        setResultadoEnvio(res)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          sid = await garantirSubmissao(true)
          if (!sid) return
          await alunoAvaliacoesRequests.patchSubmissao(sid, corpoRespostas())
          const res = await alunoAvaliacoesRequests.enviarSubmissao(sid)
          setResultadoEnvio(res)
        } else {
          throw e
        }
      }
    } finally {
      setEnviando(false)
    }
  }

  const abrirGabarito = async () => {
    setResultadoEnvio(null)
    await qc.invalidateQueries({ queryKey })
    await refetch()
  }

  if (isLoading && !view) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Carregando prova...
      </div>
    )
  }

  if (isError || !view) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">
          {isError ? "Não foi possível abrir esta prova." : "Prova não encontrada."}
        </p>
        <div className="flex gap-3">
          {isError && (
            <Button variant="outline" className="rounded-xl" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          )}
          <Button className="rounded-xl" onClick={() => router.push(voltarPara)}>
            Voltar à lista
          </Button>
        </div>
      </div>
    )
  }

  if (view.exibir_gabarito || somenteLeitura) {
    return (
      <VisualizadorGabarito
        view={view}
        onVoltar={() => router.push(voltarPara)}
      />
    )
  }

  if (resultadoEnvio) {
    const pct =
      resultadoEnvio.percentual_acerto ??
      (resultadoEnvio.nota_decimal != null
        ? Number(resultadoEnvio.nota_decimal) * 10
        : null)
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-10 w-10 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Prova enviada!</p>
          <p
            className="mt-2 text-6xl font-bold text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {pct != null ? `${Math.round(pct)}%` : "—"}
          </p>
          {resultadoEnvio.nota_decimal != null && (
            <p className="mt-2 text-muted-foreground">
              Nota {Number(resultadoEnvio.nota_decimal).toFixed(1)} / 10
            </p>
          )}
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button className="rounded-xl" onClick={() => void abrirGabarito()}>
            Ver gabarito
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => router.push(voltarPara)}
          >
            Voltar à lista
          </Button>
        </div>
      </div>
    )
  }

  const questaoAtual = view.questoes[paginaQuestao]
  const questoesRespondidas = view.questoes.filter((q) => {
    const r = respostas[q.id]
    if (q.tipo === "multipla_escolha") return r?.indice != null
    return (r?.texto?.trim().length ?? 0) > 0
  }).length
  const progresso = totalQuestoes > 0 ? (questoesRespondidas / totalQuestoes) * 100 : 0

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        Prova em andamento — uma questão por vez. Envie suas respostas para concluir.
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{view.titulo}</h1>
          {iniciando && (
            <Badge variant="secondary" className="rounded-full">
              Iniciando...
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{questoesRespondidas} de {totalQuestoes} respondidas</span>
            <span>Questão {paginaQuestao + 1} de {totalQuestoes}</span>
          </div>
          <Progress value={progresso} className="h-2 rounded-full" />
        </div>
      </div>

      {questaoAtual && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Questão {questaoAtual.ordem}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questaoAtual.conteudo ? (
              <RenderizadorDocumento documento={questaoAtual.conteudo as DocumentoJson} />
            ) : (
              <p className="text-sm text-muted-foreground">{questaoAtual.enunciado}</p>
            )}
            {questaoAtual.tipo === "multipla_escolha" && questaoAtual.alternativas ? (
              <RadioGroup
                value={String(respostas[questaoAtual.id]?.indice ?? "")}
                onValueChange={(v) =>
                  setRespostas((prev) => ({
                    ...prev,
                    [questaoAtual.id]: { indice: Number(v) },
                  }))
                }
              >
                {questaoAtual.alternativas.map((alt, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <RadioGroupItem value={String(i)} id={`${questaoAtual.id}-${i}`} />
                    <Label htmlFor={`${questaoAtual.id}-${i}`}>{alt}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                className="rounded-xl min-h-[140px]"
                placeholder="Digite sua resposta..."
                value={respostas[questaoAtual.id]?.texto ?? ""}
                onChange={(e) =>
                  setRespostas((prev) => ({
                    ...prev,
                    [questaoAtual.id]: { texto: e.target.value },
                  }))
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      <NavegacaoPaginas
        paginaAtual={paginaQuestao}
        totalPaginas={totalQuestoes}
        rotuloPagina={`Questão ${paginaQuestao + 1} de ${totalQuestoes}`}
        onAnterior={() => setPaginaQuestao((p) => Math.max(0, p - 1))}
        onProxima={() => setPaginaQuestao((p) => Math.min(totalQuestoes - 1, p + 1))}
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="rounded-xl" onClick={() => void salvarRespostas()}>
          Salvar rascunho
        </Button>
        <Button
          className="rounded-xl gap-2"
          disabled={enviando || iniciando}
          onClick={() => void enviar()}
        >
          <Send className="h-4 w-4" />
          Enviar prova
        </Button>
      </div>
    </div>
  )
}
