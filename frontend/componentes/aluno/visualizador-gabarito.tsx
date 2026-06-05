"use client"

import * as React from "react"
import { BookOpen, CheckCircle2, ChevronLeft, Trophy, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RenderizadorDocumento } from "@/componentes/avaliacoes/renderizador-documento"
import { NavegacaoPaginas } from "@/componentes/shared/navegacao-paginas"
import type { DocumentoJson } from "@/lib/avaliacoes/documento"
import type { AlunoAvaliacaoView } from "@/lib/api/dtos/avaliacoes"
import { cn } from "@/lib/utils"

function num(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === "number" ? v : Number(v)
}

function CapaAcompanhar({ view }: { view: AlunoAvaliacaoView }) {
  const total = view.total_questoes ?? view.questoes.length
  const situacao = view.situacao
  const rotulo =
    situacao === "em_andamento" ? "Em andamento" : situacao === "pendente" ? "Pendente" : "Acompanhar"

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <BookOpen className="h-10 w-10 text-primary" />
      </div>
      <div className="w-full max-w-md space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Acompanhar prova</p>
          <h2
            className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rotulo}
          </h2>
          <Badge variant="secondary" className="mt-3 rounded-full">
            {rotulo}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {view.titulo} — {total} questão{total !== 1 ? "ões" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Use &quot;Próxima&quot; para ver cada questão com o gabarito.
        </p>
      </div>
    </div>
  )
}

function CapaResultado({ view }: { view: AlunoAvaliacaoView }) {
  const percentual =
    view.percentual_acerto ??
    (view.nota_decimal != null ? num(view.nota_decimal) * 10 : null)
  const total = view.total_questoes ?? view.questoes.length
  const corretas = view.questoes_corretas ?? view.questoes.filter((q) => q.acertou).length
  const erros = total - corretas

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Trophy className="h-10 w-10 text-primary" />
      </div>

      <div className="w-full max-w-md space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Resultado da prova</p>
          <h2
            className="mt-2 text-5xl font-bold tracking-tight text-primary sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {percentual != null ? `${Math.round(percentual)}%` : "—"}
          </h2>
          {view.nota_decimal != null && (
            <p className="mt-2 text-muted-foreground">
              Nota {num(view.nota_decimal).toFixed(1)} / 10
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            {corretas} acerto{corretas !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-red-500/10 text-red-700 dark:text-red-400">
            <XCircle className="mr-1 h-3.5 w-3.5" />
            {erros} erro{erros !== 1 ? "s" : ""}
          </Badge>
        </div>

        {percentual != null && <Progress value={percentual} className="h-2.5 rounded-full" />}

        <p className="text-sm text-muted-foreground">
          {view.titulo} — {total} questão{total !== 1 ? "ões" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Use &quot;Próxima&quot; para revisar cada questão com gabarito.
        </p>
      </div>
    </div>
  )
}

export function VisualizadorGabarito({
  view,
  voltarPara,
  onVoltar,
}: {
  view: AlunoAvaliacaoView
  voltarPara?: string
  onVoltar?: () => void
}) {
  const totalPaginas = view.questoes.length + 1
  const [pagina, setPagina] = React.useState(0)
  const concluida = view.situacao === "concluida" || (view.percentual_acerto != null || view.nota_decimal != null)

  React.useEffect(() => {
    setPagina(0)
  }, [view.id])

  const paginaCapa = pagina === 0
  const questao = paginaCapa ? null : view.questoes[pagina - 1]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        {onVoltar ? (
          <Button variant="ghost" className="rounded-xl gap-2" onClick={onVoltar}>
            <ChevronLeft className="h-4 w-4" />
            Voltar à lista
          </Button>
        ) : null}
      </div>

      <div>
        <h1 className="text-2xl font-bold">{view.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {concluida ? "Gabarito — compare as respostas" : "Gabarito — acompanhe questão a questão"}
        </p>
      </div>

      {paginaCapa ? (
        <Card className="overflow-hidden rounded-2xl border-primary/20 bg-linear-to-br from-primary/10 via-card to-card">
          <CardContent className="p-6 sm:p-8">
            {concluida ? <CapaResultado view={view} /> : <CapaAcompanhar view={view} />}
          </CardContent>
        </Card>
      ) : questao ? (
        (() => {
          const acertou = questao.acertou === true
          const errou = questao.acertou === false
          const idxAluno = questao.indice_resposta_aluno
          const idxGabarito = questao.indice_gabarito

          return (
            <Card
              className={cn(
                "rounded-2xl border-2",
                acertou && "border-emerald-500/40 bg-emerald-500/5",
                errou && "border-red-500/40 bg-red-500/5",
                !acertou && !errou && "border-border/50"
              )}
            >
              <CardHeader className="flex flex-row items-start gap-3 pb-2">
                {acertou ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                ) : errou ? (
                  <XCircle className="h-6 w-6 shrink-0 text-red-600" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Questão {questao.ordem}
                    {acertou && (
                      <span className="ml-2 text-sm font-normal text-emerald-600">Correta</span>
                    )}
                    {errou && (
                      <span className="ml-2 text-sm font-normal text-red-600">Incorreta</span>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {questao.conteudo ? (
                  <RenderizadorDocumento documento={questao.conteudo as DocumentoJson} />
                ) : (
                  <p className="text-sm text-muted-foreground">{questao.enunciado}</p>
                )}

                {questao.tipo === "multipla_escolha" && questao.alternativas && (
                  <ul className="space-y-2">
                    {questao.alternativas.map((alt, i) => {
                      const ehGabarito = idxGabarito === i
                      const ehRespostaAluno = idxAluno === i
                      return (
                        <li
                          key={i}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-sm",
                            ehGabarito && "border-emerald-500 bg-emerald-500/10 font-medium",
                            ehRespostaAluno && !ehGabarito && "border-red-500/60 bg-red-500/5",
                            !ehGabarito && !ehRespostaAluno && "border-border/40 bg-muted/30"
                          )}
                        >
                          <span className="mr-2 font-semibold text-muted-foreground">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {alt}
                          {ehGabarito && (
                            <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              (correta)
                            </span>
                          )}
                          {ehRespostaAluno && !ehGabarito && (
                            <span className="ml-2 text-xs font-semibold text-red-600">
                              (sua resposta)
                            </span>
                          )}
                          {ehRespostaAluno && ehGabarito && (
                            <span className="ml-2 text-xs font-semibold text-emerald-700">
                              (sua resposta)
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {questao.tipo === "texto_aberto" && (
                  <p className="text-sm text-muted-foreground">
                    Questão discursiva — correção pelo professor.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })()
      ) : null}

      <NavegacaoPaginas
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        rotuloPagina={
          paginaCapa
            ? concluida
              ? "Resultado"
              : "Capa"
            : `Questão ${pagina} de ${view.questoes.length}`
        }
        onAnterior={() => setPagina((p) => Math.max(0, p - 1))}
        onProxima={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
      />

      {(onVoltar || voltarPara) && pagina === totalPaginas - 1 && (
        <div className="flex justify-center pt-2">
          {onVoltar ? (
            <Button variant="outline" className="rounded-xl" onClick={onVoltar}>
              Voltar à lista
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
