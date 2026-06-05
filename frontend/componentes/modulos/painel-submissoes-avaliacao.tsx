"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Eye, RefreshCw, Users } from "lucide-react"
import { ApiError } from "@/lib/api/errors"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { VisualizadorGabarito } from "@/componentes/aluno/visualizador-gabarito"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SituacaoAvaliacaoAluno } from "@/lib/api/dtos/avaliacoes"

const LABEL_SITUACAO: Record<SituacaoAvaliacaoAluno, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
}

export function PainelSubmissoesAvaliacao({ avaliacaoId }: { avaliacaoId: string }) {
  const qc = useQueryClient()
  const [alunoSelecionado, setAlunoSelecionado] = React.useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.avaliacoes.submissoes(avaliacaoId),
    queryFn: () => avaliacoesRequests.listSubmissoes(avaliacaoId),
  })

  const { data: viewAluno, isLoading: carregandoView } = useQuery({
    queryKey: queryKeys.avaliacoes.submissaoAluno(avaliacaoId, alunoSelecionado ?? ""),
    queryFn: () => avaliacoesRequests.getSubmissaoAluno(avaliacaoId, alunoSelecionado!),
    enabled: !!alunoSelecionado,
  })

  const reabrirTentativa = async (submissaoId: string) => {
    try {
      await avaliacoesRequests.reabrirSubmissaoAluno(submissaoId)
      await qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.submissoes(avaliacaoId) })
      toast.success("Tentativa reaberta para o aluno")
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao reabrir tentativa")
    }
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6 text-sm text-muted-foreground">Carregando submissões…</CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardContent className="flex flex-col items-center gap-3 p-6">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as submissões.</p>
          <Button variant="outline" className="rounded-xl" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Submissões dos alunos
            </CardTitle>
            <Badge variant="secondary" className="rounded-full">
              {data.total_concluidas} de {data.total_alunos} concluíram
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.alunos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno matriculado nesta turma.</p>
          ) : (
            data.alunos.map((aluno) => (
              <div
                key={aluno.aluno_id}
                className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{aluno.aluno_nome}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full text-xs">
                      {LABEL_SITUACAO[aluno.situacao]}
                    </Badge>
                    {aluno.percentual_acerto != null && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(aluno.percentual_acerto)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => setAlunoSelecionado(aluno.aluno_id)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Ver respostas
                  </Button>
                  {aluno.submissao_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg"
                      onClick={() => void reabrirTentativa(aluno.submissao_id!)}
                    >
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!alunoSelecionado} onOpenChange={(aberto) => !aberto && setAlunoSelecionado(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Respostas do aluno</DialogTitle>
          </DialogHeader>
          {carregandoView || !viewAluno ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando respostas…</div>
          ) : (
            <VisualizadorGabarito
              view={viewAluno}
              onVoltar={() => setAlunoSelecionado(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
