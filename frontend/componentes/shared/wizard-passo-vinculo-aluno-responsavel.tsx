"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { HeartHandshake, RefreshCw, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import type { AlunoListItem, ResponsavelListItem } from "@/lib/api/dtos/configuracoes"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import {
  emailValido,
  gerarSenhaAleatoria,
  mascaraTelefoneBr,
} from "@/lib/formatacao/mascaras"
import { cn } from "@/lib/utils"

export type ModoVinculo = "aluno" | "responsavel"

export type ContraparteNovaForm = {
  nome: string
  email: string
  senha: string
  matricula: string
  grauParentesco: string
  telefone: string
}

export function useVinculoAlunoResponsavel() {
  const [vinculoExistente, setVinculoExistente] = React.useState(true)
  const [contraparteId, setContraparteId] = React.useState("")
  const [responsavelPrincipal, setResponsavelPrincipal] = React.useState(true)
  const [nome, setNome] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [senha, setSenha] = React.useState("")
  const [matricula, setMatricula] = React.useState("")
  const [grauParentesco, setGrauParentesco] = React.useState("")
  const [telefone, setTelefone] = React.useState("")

  const reset = React.useCallback(() => {
    setVinculoExistente(true)
    setContraparteId("")
    setResponsavelPrincipal(true)
    setNome("")
    setEmail("")
    setSenha("")
    setMatricula("")
    setGrauParentesco("")
    setTelefone("")
  }, [])

  const contraparteNovaValida = React.useMemo(
    () => !!nome.trim() && emailValido(email) && senha.trim().length >= 6,
    [nome, email, senha]
  )

  const vinculoValido = React.useCallback(
    () => (vinculoExistente ? !!contraparteId : contraparteNovaValida),
    [vinculoExistente, contraparteId, contraparteNovaValida]
  )

  const getContraparteNova = React.useCallback(
    (): ContraparteNovaForm => ({
      nome,
      email,
      senha,
      matricula,
      grauParentesco,
      telefone,
    }),
    [nome, email, senha, matricula, grauParentesco, telefone]
  )

  return {
    vinculoExistente,
    setVinculoExistente,
    contraparteId,
    setContraparteId,
    responsavelPrincipal,
    setResponsavelPrincipal,
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    matricula,
    setMatricula,
    grauParentesco,
    setGrauParentesco,
    telefone,
    setTelefone,
    reset,
    vinculoValido,
    getContraparteNova,
  }
}

export type VinculoAlunoResponsavelState = ReturnType<typeof useVinculoAlunoResponsavel>

export function getDescricaoVinculoResumo(
  modo: ModoVinculo,
  vinculo: VinculoAlunoResponsavelState,
  alunos: AlunoListItem[] | undefined,
  responsaveis: ResponsavelListItem[] | undefined
): string {
  const rotuloContraparte = modo === "aluno" ? "Responsável" : "Aluno"
  if (vinculo.vinculoExistente) {
    if (modo === "aluno") {
      const r = responsaveis?.find((x) => x.id === vinculo.contraparteId)
      return r ? `${r.nome_exibicao} (${r.email})` : "—"
    }
    const a = alunos?.find((x) => x.id === vinculo.contraparteId)
    return a
      ? `${a.nome_exibicao}${a.matricula_codigo ? ` · ${a.matricula_codigo}` : ""} (${a.email})`
      : "—"
  }
  const n = vinculo.nome.trim()
  return n ? `${rotuloContraparte} novo: ${n}` : `Novo ${rotuloContraparte.toLowerCase()}`
}

interface PassoVinculoProps {
  modo: ModoVinculo
  instituicaoId?: string
  ativo: boolean
  vinculo: VinculoAlunoResponsavelState
}

export function PassoVinculoAlunoResponsavel({
  modo,
  instituicaoId,
  ativo,
  vinculo,
}: PassoVinculoProps) {
  const Icone = modo === "aluno" ? HeartHandshake : UserRound
  const pergunta =
    modo === "aluno"
      ? "Este aluno já possui responsável cadastrado?"
      : "Este responsável já possui aluno cadastrado?"
  const rotuloContraparte = modo === "aluno" ? "responsável" : "aluno"
  const criandoContraparte = modo === "aluno" ? "responsavel" : "aluno"

  const { data: alunos } = useQuery({
    queryKey: ["vinculo-wizard", "alunos", instituicaoId ?? "scoped"],
    queryFn: () => configuracoesRequests.listAlunos(instituicaoId),
    enabled: ativo && modo === "responsavel",
  })

  const { data: responsaveis } = useQuery({
    queryKey: ["vinculo-wizard", "responsaveis", instituicaoId ?? "scoped"],
    queryFn: () => configuracoesRequests.listResponsaveis(instituicaoId),
    enabled: ativo && modo === "aluno",
  })

  const lista = modo === "aluno" ? responsaveis : alunos

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4",
          modo === "aluno"
            ? "border-amber-500/30"
            : "border-emerald-500/30"
        )}
      >
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            modo === "aluno" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
          )}
        >
          <Icone className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium leading-snug">{pergunta}</p>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="vinculo-existente" className="text-sm text-muted-foreground cursor-pointer">
              {vinculo.vinculoExistente
                ? "Sim, vincular existente"
                : "Não, cadastrar agora"}
            </Label>
            <Switch
              id="vinculo-existente"
              checked={vinculo.vinculoExistente}
              onCheckedChange={(c) => {
                vinculo.setVinculoExistente(c)
                vinculo.setContraparteId("")
              }}
            />
          </div>
        </div>
      </div>

      {vinculo.vinculoExistente ? (
        <div className="space-y-2">
          <Label>Selecione o {rotuloContraparte} *</Label>
          <Select value={vinculo.contraparteId} onValueChange={vinculo.setContraparteId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={`Escolha um ${rotuloContraparte}...`} />
            </SelectTrigger>
            <SelectContent>
              {modo === "aluno"
                ? responsaveis?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome_exibicao} — {r.email}
                    </SelectItem>
                  ))
                : alunos?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome_exibicao}
                      {a.matricula_codigo ? ` · ${a.matricula_codigo}` : ""} — {a.email}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {lista?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum {rotuloContraparte} cadastrado. Desative o toggle para cadastrar agora.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold">
            Dados do novo {rotuloContraparte}
          </p>
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input
              value={vinculo.nome}
              onChange={(e) => vinculo.setNome(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input
              type="email"
              value={vinculo.email}
              onChange={(e) => vinculo.setEmail(e.target.value)}
              className="rounded-xl"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Senha *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-lg text-xs"
                onClick={() => vinculo.setSenha(gerarSenhaAleatoria())}
              >
                <RefreshCw className="h-3 w-3" />
                Gerar senha
              </Button>
            </div>
            <Input
              type="password"
              value={vinculo.senha}
              onChange={(e) => vinculo.setSenha(e.target.value)}
              className="rounded-xl"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {criandoContraparte === "aluno" && (
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input
                value={vinculo.matricula}
                onChange={(e) => vinculo.setMatricula(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}
          {criandoContraparte === "responsavel" && (
            <>
              <div className="space-y-2">
                <Label>Grau de parentesco</Label>
                <Input
                  value={vinculo.grauParentesco}
                  onChange={(e) => vinculo.setGrauParentesco(e.target.value)}
                  className="rounded-xl"
                  placeholder="Ex: Pai, Mãe"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={vinculo.telefone}
                  onChange={(e) => vinculo.setTelefone(mascaraTelefoneBr(e.target.value))}
                  className="rounded-xl"
                  inputMode="tel"
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-border/40 px-3 py-2.5">
        <Checkbox
          id="resp-principal"
          checked={vinculo.responsavelPrincipal}
          onCheckedChange={(c) => vinculo.setResponsavelPrincipal(c === true)}
        />
        <Label htmlFor="resp-principal" className="cursor-pointer text-sm font-normal">
          Marcar responsável como principal
        </Label>
      </div>
    </div>
  )
}
