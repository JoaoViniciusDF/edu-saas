"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResultadoLote } from "@/componentes/super-admin/usuario/resultado-lote"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { DiretorioPlataformaItem, LoteResultadoResponse } from "@/lib/api/dtos/configuracoes"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: DiretorioPlataformaItem
  instituicaoId: string
}

export function ModalGerenciarTurma({ open, onOpenChange, turma, instituicaoId }: Props) {
  const queryClient = useQueryClient()
  const turmaId = turma.id
  const [dataInicio, setDataInicio] = React.useState(new Date().toISOString().slice(0, 10))
  const [alunosSel, setAlunosSel] = React.useState<Set<string>>(new Set())
  const [profSel, setProfSel] = React.useState<Set<string>>(new Set())
  const [titularProfId, setTitularProfId] = React.useState("")
  const [loteResultado, setLoteResultado] = React.useState<LoteResultadoResponse | null>(null)

  const { data: turmaAtual } = useQuery({
    queryKey: ["super-admin", "turma", turmaId],
    queryFn: () => configuracoesRequests.getTurma(turmaId),
    enabled: open,
  })

  const { data: professores } = useQuery({
    queryKey: ["super-admin", "professores", instituicaoId],
    queryFn: () => configuracoesRequests.listProfessores(instituicaoId),
    enabled: open,
  })

  const { data: alunosTurma } = useQuery({
    queryKey: ["super-admin", "turma-alunos", turmaId],
    queryFn: () => configuracoesRequests.listTurmaAlunos(turmaId),
    enabled: open,
  })

  const { data: alunosInst } = useQuery({
    queryKey: ["super-admin", "alunos", instituicaoId],
    queryFn: () => configuracoesRequests.listAlunos(instituicaoId),
    enabled: open,
  })

  const vinculados = new Set((turmaAtual?.professores ?? []).map((p) => p.id))

  const associarProf = useMutation({
    mutationFn: () =>
      configuracoesRequests.associarProfessoresTurmaLote({
        instituicao_id: instituicaoId,
        turma_id: turmaId,
        professor_ids: [...profSel],
        professor_titular_id: titularProfId || [...profSel][0],
      }),
    onSuccess: (res) => {
      setLoteResultado(res)
      setProfSel(new Set())
      setTitularProfId("")
      void queryClient.invalidateQueries({ queryKey: ["super-admin"] })
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "turma", turmaId] })
    },
  })

  const matricular = useMutation({
    mutationFn: () =>
      configuracoesRequests.criarMatriculasLote({
        instituicao_id: instituicaoId,
        turma_id: turmaId,
        aluno_ids: [...alunosSel],
        data_inicio: dataInicio,
      }),
    onSuccess: (res) => {
      setLoteResultado(res)
      setAlunosSel(new Set())
      void queryClient.invalidateQueries({ queryKey: ["super-admin"] })
    },
  })

  const alunosDisponiveis = React.useMemo(() => {
    const naTurma = new Set(alunosTurma?.map((a) => a.id) ?? [])
    return alunosInst?.filter((a) => !naTurma.has(a.id)) ?? []
  }, [alunosInst, alunosTurma])

  const profsNaTurma = turmaAtual?.professores ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar turma — {turma.nome}</DialogTitle>
        </DialogHeader>

        <ResultadoLote resultado={loteResultado} />

        <div className="space-y-6">
          {profsNaTurma.length > 0 && (
            <div className="space-y-2">
              <Label>Professores na turma</Label>
              <ul className="text-sm space-y-1">
                {profsNaTurma.map((p) => (
                  <li key={p.id}>
                    {p.nome_exibicao}
                    {p.eh_titular ? " (titular)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Label>Adicionar professores</Label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {professores
                ?.filter((p) => !vinculados.has(p.id))
                .map((p) => {
                  const sel = profSel.has(p.id)
                  return (
                    <div
                      key={p.id}
                      className={cn("flex items-center gap-2 text-sm rounded-lg p-1", sel && "bg-muted/40")}
                    >
                      <Checkbox
                        checked={sel}
                        onCheckedChange={(c) => {
                          const next = new Set(profSel)
                          if (c) {
                            next.add(p.id)
                            if (next.size === 1) setTitularProfId(p.id)
                          } else {
                            next.delete(p.id)
                            if (titularProfId === p.id) setTitularProfId("")
                          }
                          setProfSel(next)
                        }}
                      />
                      <span className="flex-1">{p.nome_exibicao}</span>
                      {sel && (
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="titular-prof-sa"
                            checked={titularProfId === p.id}
                            onChange={() => setTitularProfId(p.id)}
                          />
                          Titular
                        </label>
                      )}
                    </div>
                  )
                })}
            </div>
            <Button
              size="sm"
              disabled={profSel.size === 0 || associarProf.isPending}
              onClick={() => void associarProf.mutateAsync()}
            >
              Associar professores
            </Button>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Matricular alunos</Label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <div className="max-h-40 overflow-y-auto space-y-2">
              {alunosDisponiveis.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={alunosSel.has(a.id)}
                    onCheckedChange={(c) => {
                      const next = new Set(alunosSel)
                      if (c) next.add(a.id)
                      else next.delete(a.id)
                      setAlunosSel(next)
                    }}
                  />
                  {a.nome_exibicao}
                </label>
              ))}
              {alunosDisponiveis.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum aluno disponível.</p>
              )}
            </div>
            <Button
              size="sm"
              disabled={alunosSel.size === 0 || matricular.isPending}
              onClick={() => void matricular.mutateAsync()}
            >
              Matricular selecionados
            </Button>
          </div>

          {alunosTurma && alunosTurma.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label>Alunos na turma ({alunosTurma.length})</Label>
              <ul className="text-sm space-y-1">
                {alunosTurma.map((a) => (
                  <li key={a.id}>{a.nome_exibicao}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
