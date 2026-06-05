"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Users } from "lucide-react"
import { toast } from "sonner"
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
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { TurmaListItem } from "@/lib/api/dtos/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import {
  associarProfessoresTurmaOpcional,
  matricularAlunosOpcional,
  resolverInstituicaoId,
} from "@/lib/configuracoes/pos-criacao-turma-matricula"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  turma: TurmaListItem
}

export function ModalGerenciarTurmaApp({ open, onOpenChange, turma }: Props) {
  const queryClient = useQueryClient()
  const turmaId = turma.id
  const [dataInicio, setDataInicio] = React.useState(new Date().toISOString().slice(0, 10))
  const [alunosSel, setAlunosSel] = React.useState<Set<string>>(new Set())
  const [profSel, setProfSel] = React.useState<Set<string>>(new Set())
  const [titularProfId, setTitularProfId] = React.useState("")

  const { data: turmaAtual } = useQuery({
    queryKey: ["cadastros", "turma", turmaId],
    queryFn: () => configuracoesRequests.getTurma(turmaId),
    enabled: open,
  })

  const { data: professores = [] } = useQuery({
    queryKey: queryKeys.cadastros.professores(),
    queryFn: () => configuracoesRequests.listProfessores(),
    enabled: open,
  })

  const { data: alunosTurma = [] } = useQuery({
    queryKey: ["cadastros", "turma-alunos", turmaId],
    queryFn: () => configuracoesRequests.listTurmaAlunos(turmaId),
    enabled: open,
  })

  const { data: alunosInst = [] } = useQuery({
    queryKey: queryKeys.cadastros.alunos(),
    queryFn: () => configuracoesRequests.listAlunos(),
    enabled: open,
  })

  const vinculados = new Set((turmaAtual?.professores ?? turma.professores ?? []).map((p) => p.id))

  const associarProf = useMutation({
    mutationFn: async () => {
      const instId = await resolverInstituicaoId()
      const msg = await associarProfessoresTurmaOpcional(turmaId, {
        ativo: true,
        professorIds: [...profSel],
        titularProfessorId: titularProfId || [...profSel][0],
        instituicaoId: instId,
      })
      if (msg) toast.success(msg)
    },
    onSuccess: () => {
      setProfSel(new Set())
      setTitularProfId("")
      void queryClient.invalidateQueries({ queryKey: queryKeys.cadastros.turmas() })
      void queryClient.invalidateQueries({ queryKey: ["cadastros", "turma", turmaId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const matricular = useMutation({
    mutationFn: async () => {
      const msg = await matricularAlunosOpcional(turmaId, {
        ativo: true,
        alunoIds: [...alunosSel],
        dataInicio,
      })
      if (msg) toast.success(msg)
    },
    onSuccess: () => {
      setAlunosSel(new Set())
      void queryClient.invalidateQueries({ queryKey: ["cadastros", "turma-alunos", turmaId] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cadastros.turmas() })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const idsNaTurma = new Set(alunosTurma.map((a) => a.id))
  const alunosDisponiveis = alunosInst.filter((a) => !idsNaTurma.has(a.id))
  const profsNaTurma = turmaAtual?.professores ?? turma.professores ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            Gerenciar turma — {turma.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {profsNaTurma.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Professores na turma</h4>
              <ul className="text-sm space-y-1">
                {profsNaTurma.map((p) => (
                  <li key={p.id} className="text-muted-foreground">
                    {p.nome_exibicao}
                    {p.eh_titular ? " (titular)" : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h4 className="text-sm font-semibold">Adicionar professores</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-border/50 p-3">
              {professores
                .filter((p) => !vinculados.has(p.id))
                .map((p) => {
                  const sel = profSel.has(p.id)
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2",
                        sel && "bg-primary/5"
                      )}
                    >
                      <Checkbox
                        checked={sel}
                        onCheckedChange={(c) => {
                          setProfSel((prev) => {
                            const next = new Set(prev)
                            if (c) {
                              next.add(p.id)
                              if (next.size === 1) setTitularProfId(p.id)
                            } else {
                              next.delete(p.id)
                              if (titularProfId === p.id) setTitularProfId("")
                            }
                            return next
                          })
                        }}
                      />
                      <span className="text-sm flex-1">{p.nome_exibicao}</span>
                      {sel && (
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="titular-prof"
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
              className="rounded-xl w-full"
              disabled={profSel.size === 0 || associarProf.isPending}
              onClick={() => associarProf.mutate()}
            >
              Associar professores ({profSel.size})
            </Button>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold">Matricular alunos</h4>
            <div className="space-y-2">
              <Label>Data de início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-border/50 p-3">
              {alunosDisponiveis.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum aluno disponível</p>
              ) : (
                alunosDisponiveis.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={alunosSel.has(a.id)}
                      onCheckedChange={(c) => {
                        setAlunosSel((prev) => {
                          const next = new Set(prev)
                          if (c) next.add(a.id)
                          else next.delete(a.id)
                          return next
                        })
                      }}
                    />
                    {a.nome_exibicao}
                  </label>
                ))
              )}
            </div>
            <Button
              className="rounded-xl w-full"
              disabled={alunosSel.size === 0 || matricular.isPending}
              onClick={() => matricular.mutate()}
            >
              Matricular selecionados ({alunosSel.size})
            </Button>
          </section>

          {alunosTurma.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Alunos na turma ({alunosTurma.length})</h4>
              <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                {alunosTurma.map((a) => (
                  <li key={a.id}>{a.nome_exibicao}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
