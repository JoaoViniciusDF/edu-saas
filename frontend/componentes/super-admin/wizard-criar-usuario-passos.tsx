"use client"

import * as React from "react"
import {
  Check,
  GraduationCap,
  HeartHandshake,
  RefreshCw,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  WizardResumo,
  WizardResumoLinha,
} from "@/components/ui/modal-wizard-shell"
import type { TipoPerfilUsuario } from "@/lib/api/dtos/configuracoes"
import {
  emailValido,
  gerarSenhaAleatoria,
  mascaraTelefoneBr,
} from "@/lib/formatacao/mascaras"
import { cn } from "@/lib/utils"
import { BadgePerfil } from "./badge-perfil"
import { LABEL_PERFIL } from "./utils"

export const PERFIL_ICONS: Record<string, React.ElementType> = {
  super_admin: Sparkles,
  administrador: Shield,
  professor: GraduationCap,
  aluno: UserRound,
  responsavel: HeartHandshake,
}

export const PERFIL_CORES: Record<string, string> = {
  super_admin: "border-fuchsia-500/40 bg-fuchsia-500/5 hover:border-fuchsia-500",
  administrador: "border-violet-500/40 bg-violet-500/5 hover:border-violet-500",
  professor: "border-blue-500/40 bg-blue-500/5 hover:border-blue-500",
  aluno: "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500",
  responsavel: "border-amber-500/40 bg-amber-500/5 hover:border-amber-500",
}

export type FormularioCriarUsuario = {
  perfil: TipoPerfilUsuario | ""
  nome: string
  email: string
  senha: string
  matricula: string
  registro: string
  grauParentesco: string
  telefone: string
}

export function useFormularioCriarUsuario(perfilInicial: TipoPerfilUsuario | "" = "") {
  const [perfil, setPerfil] = React.useState<TipoPerfilUsuario | "">(perfilInicial)
  const [nome, setNome] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [senha, setSenha] = React.useState("")
  const [matricula, setMatricula] = React.useState("")
  const [registro, setRegistro] = React.useState("")
  const [grauParentesco, setGrauParentesco] = React.useState("")
  const [telefone, setTelefone] = React.useState("")

  const reset = React.useCallback(() => {
    setPerfil(perfilInicial)
    setNome("")
    setEmail("")
    setSenha("")
    setMatricula("")
    setRegistro("")
    setGrauParentesco("")
    setTelefone("")
  }, [perfilInicial])

  const dadosValidos = React.useMemo(
    () => !!nome.trim() && emailValido(email) && senha.trim().length >= 6,
    [nome, email, senha]
  )

  return {
    perfil,
    setPerfil,
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    matricula,
    setMatricula,
    registro,
    setRegistro,
    grauParentesco,
    setGrauParentesco,
    telefone,
    setTelefone,
    reset,
    dadosValidos,
  }
}

export function PassoSelecionarPerfil({
  perfis,
  perfil,
  onSelecionar,
}: {
  perfis: { value: TipoPerfilUsuario; label: string }[]
  perfil: TipoPerfilUsuario | ""
  onSelecionar: (p: TipoPerfilUsuario) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {perfis.map((p) => {
        const Icon = PERFIL_ICONS[p.value] ?? UserRound
        const selecionado = perfil === p.value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onSelecionar(p.value)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all",
              PERFIL_CORES[p.value],
              selecionado && "ring-2 ring-primary scale-[1.02]"
            )}
          >
            <Icon className="h-8 w-8" />
            <span className="font-semibold">{p.label}</span>
            {selecionado && <Check className="h-4 w-4 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}

export function PassoDadosUsuario({
  perfil,
  nome,
  setNome,
  email,
  setEmail,
  senha,
  setSenha,
  matricula,
  setMatricula,
  registro,
  setRegistro,
  grauParentesco,
  setGrauParentesco,
  telefone,
  setTelefone,
}: {
  perfil: TipoPerfilUsuario | ""
  nome: string
  setNome: (v: string) => void
  email: string
  setEmail: (v: string) => void
  senha: string
  setSenha: (v: string) => void
  matricula: string
  setMatricula: (v: string) => void
  registro: string
  setRegistro: (v: string) => void
  grauParentesco: string
  setGrauParentesco: (v: string) => void
  telefone: string
  setTelefone: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome completo *</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>E-mail *</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            onClick={() => setSenha(gerarSenhaAleatoria())}
          >
            <RefreshCw className="h-3 w-3" />
            Gerar senha
          </Button>
        </div>
        <Input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-xl"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      {perfil === "aluno" && (
        <div className="space-y-2">
          <Label>Matrícula</Label>
          <Input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="rounded-xl"
          />
        </div>
      )}
      {perfil === "professor" && (
        <div className="space-y-2">
          <Label>Registro funcional</Label>
          <Input
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            className="rounded-xl"
          />
        </div>
      )}
      {perfil === "responsavel" && (
        <>
          <div className="space-y-2">
            <Label>Grau de parentesco</Label>
            <Input
              value={grauParentesco}
              onChange={(e) => setGrauParentesco(e.target.value)}
              className="rounded-xl"
              placeholder="Ex: Pai, Mãe"
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefoneBr(e.target.value))}
              className="rounded-xl"
              inputMode="tel"
            />
          </div>
        </>
      )}
    </div>
  )
}

export function PassoConfirmarUsuario({
  perfil,
  nome,
  email,
  matricula,
  registro,
  instituicaoNome,
}: {
  perfil: TipoPerfilUsuario | ""
  nome: string
  email: string
  matricula: string
  registro: string
  instituicaoNome?: string
}) {
  return (
    <WizardResumo>
      {instituicaoNome && (
        <WizardResumoLinha rotulo="Instituição" valor={instituicaoNome} />
      )}
      <WizardResumoLinha
        rotulo="Perfil"
        valor={perfil ? <BadgePerfil perfil={perfil} /> : "—"}
      />
      <WizardResumoLinha rotulo="Nome" valor={nome} />
      <WizardResumoLinha rotulo="E-mail" valor={email} />
      {matricula && <WizardResumoLinha rotulo="Matrícula" valor={matricula} />}
      {registro && <WizardResumoLinha rotulo="Registro" valor={registro} />}
      <p className="text-center text-sm text-muted-foreground">
        Pronto para criar um novo {perfil ? LABEL_PERFIL[perfil].toLowerCase() : "usuário"}!
      </p>
    </WizardResumo>
  )
}
