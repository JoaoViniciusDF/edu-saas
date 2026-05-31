"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { TipoPerfilUsuario, VisaoPlataforma } from "@/lib/api/dtos/configuracoes"
import { cn } from "@/lib/utils"
import { LABEL_PERFIL, LABEL_VISAO, VISAO_OPCOES } from "./utils"

export interface FiltrosDiretorioState {
  visao: VisaoPlataforma
  instituicaoId: string
  turmaIds: string[]
  perfil: TipoPerfilUsuario | ""
  busca: string
}

interface Props {
  filtros: FiltrosDiretorioState
  onChange: (filtros: FiltrosDiretorioState) => void
  ocultarVisao?: boolean
  instituicaoFixa?: string
  visoesDisponiveis?: VisaoPlataforma[]
}

export function FiltrosDiretorio({
  filtros,
  onChange,
  ocultarVisao = false,
  instituicaoFixa,
  visoesDisponiveis = VISAO_OPCOES,
}: Props) {
  const [instOpen, setInstOpen] = React.useState(false)
  const [turmaOpen, setTurmaOpen] = React.useState(false)

  const instId = instituicaoFixa ?? filtros.instituicaoId

  const { data: instituicoes } = useQuery({
    queryKey: ["super-admin", "instituicoes-lista"],
    queryFn: async () => (await configuracoesRequests.listInstituicoes()).items,
  })

  const { data: turmas = [] } = useQuery({
    queryKey: ["super-admin", "turmas", instId],
    queryFn: () => configuracoesRequests.listTurmas({ instituicao_id: instId || undefined }),
    enabled: !!instId,
  })

  const instituicaoNome = instituicoes?.find((i) => i.id === instId)?.nome_fantasia

  const precisaTurma =
    (filtros.visao === "usuarios" ||
      filtros.visao === "alunos_turma" ||
      filtros.visao === "professores_turma") &&
    !!instId

  const mostrarFiltrosUsuario = filtros.visao === "usuarios"

  const toggleTurma = (id: string) => {
    const ids = filtros.turmaIds.includes(id)
      ? filtros.turmaIds.filter((t) => t !== id)
      : [...filtros.turmaIds, id]
    onChange({ ...filtros, turmaIds: ids })
  }

  return (
    <div className="space-y-4">
      {!ocultarVisao && (
        <div className="flex flex-wrap gap-2">
          {visoesDisponiveis.map((v) => (
            <Button
              key={v}
              size="sm"
              variant={filtros.visao === v ? "default" : "outline"}
              className={cn("rounded-xl", filtros.visao === v && "shadow-soft")}
              onClick={() =>
                onChange({
                  ...filtros,
                  visao: v,
                  turmaIds: [],
                  ...(v === "instituicoes" ? { instituicaoId: "", perfil: "" } : {}),
                })
              }
            >
              {LABEL_VISAO[v]}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm">
        {!instituicaoFixa && mostrarFiltrosUsuario && (
          <Popover open={instOpen} onOpenChange={setInstOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 min-w-[180px] justify-between">
                {instituicaoNome ?? "Instituição"}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 rounded-xl" align="start">
              <Command>
                <CommandInput placeholder="Buscar instituição..." />
                <CommandList>
                  <CommandEmpty>Nenhuma instituição.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onChange({ ...filtros, instituicaoId: "", turmaIds: [] })
                        setInstOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", !filtros.instituicaoId ? "opacity-100" : "opacity-0")} />
                      Todas
                    </CommandItem>
                    {instituicoes?.map((i) => (
                      <CommandItem
                        key={i.id}
                        onSelect={() => {
                          onChange({ ...filtros, instituicaoId: i.id, turmaIds: [] })
                          setInstOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filtros.instituicaoId === i.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {i.nome_fantasia}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {precisaTurma && instId && (
          <Popover open={turmaOpen} onOpenChange={setTurmaOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2">
                Turmas
                {filtros.turmaIds.length > 0 && (
                  <Badge variant="secondary" className="rounded-full">
                    {filtros.turmaIds.length}
                  </Badge>
                )}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] rounded-xl" align="start">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {turmas.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Nenhuma turma.</p>
                ) : (
                  turmas.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={filtros.turmaIds.includes(t.id)}
                        onCheckedChange={() => toggleTurma(t.id)}
                      />
                      <span className="text-sm">{t.nome}</span>
                    </label>
                  ))
                )}
              </div>
              {filtros.turmaIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full rounded-lg"
                  onClick={() => onChange({ ...filtros, turmaIds: [] })}
                >
                  Limpar seleção
                </Button>
              )}
            </PopoverContent>
          </Popover>
        )}

        {mostrarFiltrosUsuario && (
          <Select
            value={filtros.perfil || "todos"}
            onValueChange={(v) =>
              onChange({ ...filtros, perfil: v === "todos" ? "" : (v as TipoPerfilUsuario) })
            }
          >
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os perfis</SelectItem>
              {(["administrador", "professor", "aluno", "responsavel"] as TipoPerfilUsuario[]).map(
                (p) => (
                  <SelectItem key={p} value={p}>
                    {LABEL_PERFIL[p]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busca}
            onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
            placeholder="Buscar por nome ou e-mail..."
            className="rounded-xl pl-9"
          />
          {filtros.busca && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onChange({ ...filtros, busca: "" })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
