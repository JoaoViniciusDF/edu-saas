"use client"

import Link from "next/link"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, ClipboardList } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AlunoAvaliacaoDisponivel, SituacaoAvaliacaoAluno } from "@/lib/api/dtos/avaliacoes"

const LABEL_SITUACAO: Record<SituacaoAvaliacaoAluno, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
}

const BADGE_SITUACAO: Record<SituacaoAvaliacaoAluno, "default" | "secondary" | "outline"> = {
  pendente: "default",
  em_andamento: "secondary",
  concluida: "outline",
}

type FiltroProva = "todas" | "a_fazer" | "concluidas"

const FILTROS: { id: FiltroProva; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "a_fazer", rotulo: "A fazer" },
  { id: "concluidas", rotulo: "Concluídas" },
]

function resultadoProva(prova: AlunoAvaliacaoDisponivel): string | null {
  if (prova.situacao !== "concluida") return null
  if (prova.percentual_acerto != null) return `${Math.round(prova.percentual_acerto)}%`
  if (prova.nota_decimal != null) return `Nota ${Number(prova.nota_decimal).toFixed(1)}`
  return "Finalizada"
}

function acaoProva(prova: AlunoAvaliacaoDisponivel, somenteLeitura: boolean): string {
  if (somenteLeitura) {
    if (prova.situacao === "concluida") return "Ver gabarito"
    if (prova.situacao === "em_andamento") return "Acompanhar prova"
    return "Ver gabarito"
  }
  if (prova.situacao === "concluida") return "Ver gabarito"
  if (prova.situacao === "em_andamento") return "Continuar"
  return "Iniciar prova"
}

export function ListaProvasAluno({
  queryKey,
  queryFn,
  basePath,
  somenteLeitura = false,
}: {
  queryKey: readonly unknown[]
  queryFn: () => Promise<AlunoAvaliacaoDisponivel[]>
  basePath: string
  somenteLeitura?: boolean
}) {
  const [filtro, setFiltro] = React.useState<FiltroProva>("todas")

  const { data: provas = [], isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn,
  })

  const provasFiltradas = React.useMemo(() => {
    if (filtro === "a_fazer") {
      return provas.filter((p) => p.situacao === "pendente" || p.situacao === "em_andamento")
    }
    if (filtro === "concluidas") {
      return provas.filter((p) => p.situacao === "concluida")
    }
    return provas
  }, [provas, filtro])

  const contagem = React.useMemo(
    () => ({
      todas: provas.length,
      a_fazer: provas.filter((p) => p.situacao === "pendente" || p.situacao === "em_andamento").length,
      concluidas: provas.filter((p) => p.situacao === "concluida").length,
    }),
    [provas]
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Carregando provas...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">Não foi possível carregar suas provas.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {somenteLeitura ? "Avaliações do aluno" : "Minhas provas"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {somenteLeitura
            ? "Visualização das avaliações — sem permissão para responder."
            : "Lista completa com filtros para acompanhar o que falta e o que já foi feito."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              filtro === item.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {item.rotulo}
            <span className="ml-1.5 opacity-70">({contagem[item.id]})</span>
          </button>
        ))}
      </div>

      {provas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-foreground">Nenhuma prova no momento</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando o professor publicar avaliações, elas aparecerão aqui.
          </p>
        </div>
      ) : provasFiltradas.length === 0 ? (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma prova neste filtro.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border/50 bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Prova</span>
            <span className="w-28 text-center">Situação</span>
            <span className="w-24 text-center">Resultado</span>
            <span className="w-28 text-right">Ação</span>
          </div>

          <ul className="divide-y divide-border/50">
            {provasFiltradas.map((prova) => {
              const href = `${basePath}/${prova.id}`
              const resultado = resultadoProva(prova)
              const pendente = prova.situacao !== "concluida"

              return (
                <li key={prova.id}>
                  <Link
                    href={href}
                    className={cn(
                      "grid gap-3 px-4 py-4 transition-colors hover:bg-secondary/40 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4",
                      pendente && "bg-primary/[0.03]"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{prova.titulo}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{prova.turma_nome}</p>
                      {prova.prazo_utc && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Prazo: {new Date(prova.prazo_utc).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:w-28 sm:justify-center">
                      <Badge
                        variant={BADGE_SITUACAO[prova.situacao]}
                        className="rounded-full"
                      >
                        {LABEL_SITUACAO[prova.situacao]}
                      </Badge>
                    </div>

                    <div className="text-sm sm:w-24 sm:text-center">
                      {resultado ? (
                        <span className="font-semibold text-foreground">{resultado}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:w-28 sm:justify-end">
                      <span className="text-sm font-medium text-primary sm:hidden">
                        {acaoProva(prova, somenteLeitura)}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
