"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { TipoPerfilUsuario } from "@/lib/api/dtos/configuracoes"
import { PERFIS_CRIACAO } from "@/lib/api/dtos/configuracoes"
import { cn } from "@/lib/utils"
import { BadgePerfil } from "./badge-perfil"
import { LABEL_PERFIL } from "./utils"

const ETAPAS = ["Instituição", "Perfil", "Dados", "Confirmar"]

const PERFIL_ICONS: Record<string, React.ElementType> = {
  administrador: Shield,
  professor: GraduationCap,
  aluno: UserRound,
  responsavel: HeartHandshake,
}

const PERFIL_CORES: Record<string, string> = {
  administrador: "border-violet-500/40 bg-violet-500/5 hover:border-violet-500",
  professor: "border-blue-500/40 bg-blue-500/5 hover:border-blue-500",
  aluno: "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500",
  responsavel: "border-amber-500/40 bg-amber-500/5 hover:border-amber-500",
}

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function ModalCriarUsuarioWizard({ aberto, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [etapa, setEtapa] = React.useState(0)
  const [instituicaoId, setInstituicaoId] = React.useState("")
  const [perfil, setPerfil] = React.useState<TipoPerfilUsuario | "">("")
  const [nome, setNome] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [senha, setSenha] = React.useState("Demo@2026")
  const [matricula, setMatricula] = React.useState("")
  const [registro, setRegistro] = React.useState("")
  const [grauParentesco, setGrauParentesco] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  const { data: instituicoes } = useQuery({
    queryKey: ["super-admin", "instituicoes-lista"],
    queryFn: async () => {
      const res = await configuracoesRequests.listInstituicoes()
      return res.items
    },
    enabled: aberto,
  })

  const reset = () => {
    setEtapa(0)
    setInstituicaoId("")
    setPerfil("")
    setNome("")
    setEmail("")
    setSenha("Demo@2026")
    setMatricula("")
    setRegistro("")
    setGrauParentesco("")
    setTelefone("")
  }

  const instituicaoNome = instituicoes?.find((i) => i.id === instituicaoId)?.nome_fantasia

  const podeAvancar = () => {
    if (etapa === 0) return !!instituicaoId
    if (etapa === 1) return !!perfil
    if (etapa === 2) return !!nome.trim() && !!email.trim() && !!senha.trim()
    return true
  }

  const salvar = async () => {
    if (!perfil || !instituicaoId) return
    setSalvando(true)
    try {
      await configuracoesRequests.createUsuario({
        tipo_perfil: perfil,
        instituicao_id: instituicaoId,
        nome_exibicao: nome.trim(),
        email: email.trim(),
        senha,
        matricula_codigo: matricula.trim() || undefined,
        registro_funcional: registro.trim() || undefined,
        grau_parentesco: grauParentesco.trim() || undefined,
        telefone: telefone.trim() || undefined,
      })
      toast.success("Usuário criado com sucesso!")
      void qc.invalidateQueries({ queryKey: ["super-admin"] })
      reset()
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-soft">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Novo usuário</DialogTitle>
          <Progress value={((etapa + 1) / ETAPAS.length) * 100} className="mt-3 h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {ETAPAS.map((e, i) => (
              <span key={e} className={cn(i <= etapa && "font-semibold text-primary")}>
                {i + 1}. {e}
              </span>
            ))}
          </div>
        </DialogHeader>

        {etapa === 0 && (
          <div className="space-y-3">
            <Label>Selecione a instituição</Label>
            <Select value={instituicaoId} onValueChange={setInstituicaoId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Escolha uma instituição..." />
              </SelectTrigger>
              <SelectContent>
                {instituicoes?.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {etapa === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {PERFIS_CRIACAO.map((p) => {
              const Icon = PERFIL_ICONS[p.value] ?? UserRound
              const selecionado = perfil === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPerfil(p.value)}
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
        )}

        {etapa === 2 && (
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
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="rounded-xl"
              />
            </div>
            {perfil === "aluno" && (
              <div className="space-y-2">
                <Label>Matrícula</Label>
                <Input value={matricula} onChange={(e) => setMatricula(e.target.value)} className="rounded-xl" />
              </div>
            )}
            {perfil === "professor" && (
              <div className="space-y-2">
                <Label>Registro funcional</Label>
                <Input value={registro} onChange={(e) => setRegistro(e.target.value)} className="rounded-xl" />
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
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="rounded-xl" />
                </div>
              </>
            )}
          </div>
        )}

        {etapa === 3 && (
          <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instituição</span>
              <span className="font-medium">{instituicaoNome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Perfil</span>
              {perfil && <BadgePerfil perfil={perfil} />}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nome</span>
              <span className="font-medium">{nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">E-mail</span>
              <span className="font-medium">{email}</span>
            </div>
            {matricula && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Matrícula</span>
                <span className="font-medium">{matricula}</span>
              </div>
            )}
            {registro && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registro</span>
                <span className="font-medium">{registro}</span>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Pronto para criar um novo {perfil ? LABEL_PERFIL[perfil].toLowerCase() : "usuário"}!
            </p>
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-1"
            disabled={etapa === 0}
            onClick={() => setEtapa((e) => e - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          {etapa < ETAPAS.length - 1 ? (
            <Button
              className="rounded-xl gap-1 bg-gradient-to-br from-primary to-primary/80"
              disabled={!podeAvancar()}
              onClick={() => setEtapa((e) => e + 1)}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="rounded-xl bg-gradient-to-br from-primary to-primary/80"
              disabled={salvando}
              onClick={() => void salvar()}
            >
              {salvando ? "Criando..." : "Criar usuário"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
