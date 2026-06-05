"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { GraduationCap, Users, UserRound } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { AlunoListItem, ProfessorListItem, TurmaListItem } from "@/lib/api/dtos/configuracoes"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { cn } from "@/lib/utils"

function ToggleCard({
  pergunta,
  ativo,
  onAtivoChange,
  icone: Icone,
  corBorda,
}: {
  pergunta: string
  ativo: boolean
  onAtivoChange: (v: boolean) => void
  icone: typeof Users
  corBorda: string
}) {
  return (
    <div className={cn("flex gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4", corBorda)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icone className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-3">
        <p className="text-sm font-medium leading-snug">{pergunta}</p>
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm text-muted-foreground cursor-pointer">
            {ativo ? "Sim, associar agora" : "Não, pular esta etapa"}
          </Label>
          <Switch checked={ativo} onCheckedChange={onAtivoChange} />
        </div>
      </div>
    </div>
  )
}

export function useTurmaAlunoOpcional() {
  const [ativo, setAtivo] = React.useState(false)
  const [turmaId, setTurmaId] = React.useState("")
  const [dataInicio, setDataInicio] = React.useState(new Date().toISOString().slice(0, 10))

  const reset = React.useCallback(() => {
    setAtivo(false)
    setTurmaId("")
    setDataInicio(new Date().toISOString().slice(0, 10))
  }, [])

  const valido = React.useCallback(() => !ativo || !!turmaId, [ativo, turmaId])

  return { ativo, setAtivo, turmaId, setTurmaId, dataInicio, setDataInicio, reset, valido }
}

export type TurmaAlunoOpcionalState = ReturnType<typeof useTurmaAlunoOpcional>

export function PassoTurmaAlunoOpcional({
  instituicaoId,
  ativo,
  vinculo,
}: {
  instituicaoId?: string
  ativo: boolean
  vinculo: TurmaAlunoOpcionalState
}) {
  const { data: turmas } = useQuery({
    queryKey: ["wizard", "turmas", instituicaoId ?? "scoped"],
    queryFn: () => configuracoesRequests.listTurmas(instituicaoId ? { instituicao_id: instituicaoId } : undefined),
    enabled: ativo,
  })

  return (
    <div className="space-y-4">
      <ToggleCard
        pergunta="Deseja matricular este aluno em uma turma agora?"
        ativo={vinculo.ativo}
        onAtivoChange={vinculo.setAtivo}
        icone={Users}
        corBorda="border-blue-500/30"
      />
      {vinculo.ativo && (
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="space-y-2">
            <Label>Turma</Label>
            <Select value={vinculo.turmaId} onValueChange={vinculo.setTurmaId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione a turma..." />
              </SelectTrigger>
              <SelectContent>
                {turmas?.map((t: TurmaListItem) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} · {t.ano_letivo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de início</Label>
            <Input
              type="date"
              value={vinculo.dataInicio}
              onChange={(e) => vinculo.setDataInicio(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function useTurmasProfessorOpcional() {
  const [ativo, setAtivo] = React.useState(false)
  const [turmaIds, setTurmaIds] = React.useState<Set<string>>(new Set())
  const [titularTurmaIds, setTitularTurmaIds] = React.useState<Set<string>>(new Set())

  const reset = React.useCallback(() => {
    setAtivo(false)
    setTurmaIds(new Set())
    setTitularTurmaIds(new Set())
  }, [])

  const toggleTurma = (id: string) => {
    setTurmaIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setTitularTurmaIds((t) => {
          const nt = new Set(t)
          nt.delete(id)
          return nt
        })
      } else {
        next.add(id)
        if (next.size === 1) setTitularTurmaIds(new Set([id]))
      }
      return next
    })
  }

  const toggleTitularTurma = (id: string) => {
    setTitularTurmaIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const valido = React.useCallback(() => !ativo || turmaIds.size > 0, [ativo, turmaIds])

  return {
    ativo,
    setAtivo,
    turmaIds,
    titularTurmaIds,
    toggleTitularTurma,
    toggleTurma,
    reset,
    valido,
  }
}

export type TurmasProfessorOpcionalState = ReturnType<typeof useTurmasProfessorOpcional>

export function PassoTurmasProfessorOpcional({
  instituicaoId,
  ativo,
  vinculo,
}: {
  instituicaoId?: string
  ativo: boolean
  vinculo: TurmasProfessorOpcionalState
}) {
  const { data: turmas } = useQuery({
    queryKey: ["wizard", "turmas", instituicaoId ?? "scoped"],
    queryFn: () => configuracoesRequests.listTurmas(instituicaoId ? { instituicao_id: instituicaoId } : undefined),
    enabled: ativo,
  })

  return (
    <div className="space-y-4">
      <ToggleCard
        pergunta="Deseja vincular este professor a turmas agora?"
        ativo={vinculo.ativo}
        onAtivoChange={vinculo.setAtivo}
        icone={GraduationCap}
        corBorda="border-violet-500/30"
      />
      {vinculo.ativo && (
        <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 max-h-64 overflow-y-auto">
          {turmas?.map((t) => {
            const sel = vinculo.turmaIds.has(t.id)
            return (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  sel ? "border-primary/40 bg-primary/5" : "border-border/40"
                )}
              >
                <Checkbox checked={sel} onCheckedChange={() => vinculo.toggleTurma(t.id)} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.ano_letivo}</p>
                </div>
                {sel && (
                  <label className="flex items-center gap-1.5 text-xs shrink-0 cursor-pointer">
                    <Checkbox
                      checked={vinculo.titularTurmaIds.has(t.id)}
                      onCheckedChange={() => vinculo.toggleTitularTurma(t.id)}
                    />
                    Titular
                  </label>
                )}
              </div>
            )
          })}
          {turmas?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada ainda.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function useAlunosTurmaOpcional() {
  const [ativo, setAtivo] = React.useState(false)
  const [alunoIds, setAlunoIds] = React.useState<Set<string>>(new Set())
  const [dataInicio, setDataInicio] = React.useState(new Date().toISOString().slice(0, 10))

  const reset = React.useCallback(() => {
    setAtivo(false)
    setAlunoIds(new Set())
    setDataInicio(new Date().toISOString().slice(0, 10))
  }, [])

  const toggleAluno = (id: string) => {
    setAlunoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const valido = React.useCallback(() => true, [])

  return { ativo, setAtivo, alunoIds, dataInicio, setDataInicio, toggleAluno, reset, valido }
}

export type AlunosTurmaOpcionalState = ReturnType<typeof useAlunosTurmaOpcional>

export function PassoAlunosTurmaOpcional({
  instituicaoId,
  ativo,
  vinculo,
}: {
  instituicaoId?: string
  ativo: boolean
  vinculo: AlunosTurmaOpcionalState
}) {
  const { data: alunos } = useQuery({
    queryKey: ["wizard", "alunos", instituicaoId ?? "scoped"],
    queryFn: () => configuracoesRequests.listAlunos(instituicaoId),
    enabled: ativo,
  })

  return (
    <div className="space-y-4">
      <ToggleCard
        pergunta="Deseja matricular alunos nesta turma agora?"
        ativo={vinculo.ativo}
        onAtivoChange={vinculo.setAtivo}
        icone={UserRound}
        corBorda="border-emerald-500/30"
      />
      {vinculo.ativo && (
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alunos?.map((a: AlunoListItem) => (
              <label
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5 cursor-pointer"
              >
                <Checkbox
                  checked={vinculo.alunoIds.has(a.id)}
                  onCheckedChange={() => vinculo.toggleAluno(a.id)}
                />
                <span className="text-sm">
                  {a.nome_exibicao}
                  {a.matricula_codigo ? ` · ${a.matricula_codigo}` : ""}
                </span>
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Data de início da matrícula</Label>
            <Input
              type="date"
              value={vinculo.dataInicio}
              onChange={(e) => vinculo.setDataInicio(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function useProfessoresTurmaOpcional() {
  const [ativo, setAtivo] = React.useState(false)
  const [professorIds, setProfessorIds] = React.useState<Set<string>>(new Set())
  const [titularProfessorId, setTitularProfessorId] = React.useState("")

  const reset = React.useCallback(() => {
    setAtivo(false)
    setProfessorIds(new Set())
    setTitularProfessorId("")
  }, [])

  const toggleProfessor = (id: string) => {
    setProfessorIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (titularProfessorId === id) setTitularProfessorId("")
      } else {
        next.add(id)
        if (next.size === 1) setTitularProfessorId(id)
      }
      return next
    })
  }

  const valido = React.useCallback(
    () =>
      !ativo ||
      (professorIds.size > 0 &&
        !!titularProfessorId &&
        professorIds.has(titularProfessorId)),
    [ativo, professorIds, titularProfessorId]
  )

  return {
    ativo,
    setAtivo,
    professorIds,
    titularProfessorId,
    setTitularProfessorId,
    toggleProfessor,
    reset,
    valido,
  }
}

export type ProfessoresTurmaOpcionalState = ReturnType<typeof useProfessoresTurmaOpcional>

export function PassoProfessoresTurmaOpcional({
  instituicaoId,
  ativo,
  vinculo,
}: {
  instituicaoId?: string
  ativo: boolean
  vinculo: ProfessoresTurmaOpcionalState
}) {
  const { data: professores } = useQuery({
    queryKey: ["wizard", "professores", instituicaoId ?? "scoped"],
    queryFn: () => configuracoesRequests.listProfessores(instituicaoId),
    enabled: ativo,
  })

  return (
    <div className="space-y-4">
      <ToggleCard
        pergunta="Deseja associar professores a esta turma agora?"
        ativo={vinculo.ativo}
        onAtivoChange={vinculo.setAtivo}
        icone={GraduationCap}
        corBorda="border-violet-500/30"
      />
      {vinculo.ativo && (
        <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 max-h-64 overflow-y-auto">
          {professores?.map((p: ProfessorListItem) => {
            const sel = vinculo.professorIds.has(p.id)
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  sel ? "border-primary/40 bg-primary/5" : "border-border/40"
                )}
              >
                <Checkbox
                  checked={sel}
                  onCheckedChange={() => vinculo.toggleProfessor(p.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.nome_exibicao}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
                {sel && (
                  <label className="flex items-center gap-1.5 text-xs shrink-0 cursor-pointer">
                    <input
                      type="radio"
                      name="titular-prof-turma"
                      checked={vinculo.titularProfessorId === p.id}
                      onChange={() => vinculo.setTitularProfessorId(p.id)}
                    />
                    Titular
                  </label>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function resumoTurmaAluno(
  vinculo: TurmaAlunoOpcionalState,
  turmas: TurmaListItem[] | undefined
): string | null {
  if (!vinculo.ativo || !vinculo.turmaId) return null
  const t = turmas?.find((x) => x.id === vinculo.turmaId)
  return t ? `${t.nome} (${vinculo.dataInicio})` : vinculo.turmaId
}

export function resumoTurmasProfessor(
  vinculo: TurmasProfessorOpcionalState,
  turmas: TurmaListItem[] | undefined
): string | null {
  if (!vinculo.ativo || vinculo.turmaIds.size === 0) return null
  const nomes = [...vinculo.turmaIds]
    .map((id) => turmas?.find((t) => t.id === id)?.nome ?? id)
    .join(", ")
  const titNomes = [...vinculo.titularTurmaIds]
    .map((id) => turmas?.find((t) => t.id === id)?.nome ?? id)
    .join(", ")
  return titNomes ? `${nomes} — titular em ${titNomes}` : nomes
}
