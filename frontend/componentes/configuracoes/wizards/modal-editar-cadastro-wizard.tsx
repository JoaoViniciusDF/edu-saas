"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { GraduationCap, HeartHandshake, UserRound, Users } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ModalWizardShell,
  WizardResumo,
  WizardResumoLinha,
} from "@/components/ui/modal-wizard-shell"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import type { TipoCadastroWizard } from "./modal-criar-cadastro-wizard"

const CONFIG: Record<
  TipoCadastroWizard,
  { titulo: string; icone: typeof UserRound; queryKey: readonly string[] }
> = {
  professor: { titulo: "Editar professor", icone: GraduationCap, queryKey: queryKeys.cadastros.professores() },
  aluno: { titulo: "Editar aluno", icone: UserRound, queryKey: queryKeys.cadastros.alunos() },
  responsavel: { titulo: "Editar responsável", icone: HeartHandshake, queryKey: queryKeys.cadastros.responsaveis() },
  turma: { titulo: "Editar turma", icone: Users, queryKey: queryKeys.cadastros.turmas() },
}

type ItemCadastro = {
  id: string
  nome_exibicao?: string
  nome?: string
  email?: string
  registro_funcional?: string | null
  matricula_codigo?: string | null
  grau_parentesco?: string | null
  ano_letivo?: string
}

interface Props {
  tipo: TipoCadastroWizard
  item: ItemCadastro | null
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function ModalEditarCadastroWizard({ tipo, item, aberto, onOpenChange }: Props) {
  const qc = useQueryClient()
  const cfg = CONFIG[tipo]
  const [etapa, setEtapa] = React.useState(0)
  const [nome, setNome] = React.useState("")
  const [extra, setExtra] = React.useState("")
  const [anoLetivo, setAnoLetivo] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (!item || !aberto) return
    setNome(item.nome_exibicao ?? item.nome ?? "")
    setExtra(
      item.registro_funcional ?? item.matricula_codigo ?? item.grau_parentesco ?? ""
    )
    setAnoLetivo(item.ano_letivo ?? "")
    setEtapa(0)
  }, [item, aberto])

  const etapas = tipo === "turma" ? ["Dados", "Confirmar"] : ["Dados", "Confirmar"]

  const extraLabel =
    tipo === "professor"
      ? "Registro funcional"
      : tipo === "aluno"
        ? "Matrícula"
        : tipo === "responsavel"
          ? "Grau de parentesco"
          : ""

  const salvar = async () => {
    if (!item) return
    setSalvando(true)
    try {
      if (tipo === "professor") {
        await cadastrosRequests.patchProfessor(item.id, {
          nome_exibicao: nome.trim(),
          registro_funcional: extra.trim() || null,
        })
      } else if (tipo === "aluno") {
        await cadastrosRequests.patchAluno(item.id, {
          nome_exibicao: nome.trim(),
          matricula_codigo: extra.trim() || null,
        })
      } else if (tipo === "responsavel") {
        await cadastrosRequests.patchResponsavel(item.id, {
          nome_exibicao: nome.trim(),
          grau_parentesco: extra.trim() || null,
        })
      } else {
        await cadastrosRequests.patchTurma(item.id, {
          nome: nome.trim(),
          ano_letivo: anoLetivo.trim(),
        })
      }
      toast.success("Cadastro atualizado!")
      void qc.invalidateQueries({ queryKey: cfg.queryKey })
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (!item) return null

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo={cfg.titulo}
      etapas={etapas}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={!!nome.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Salvar"
      icone={cfg.icone}
    >
      {etapa === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
          </div>
          {tipo === "turma" ? (
            <div className="space-y-2">
              <Label>Ano letivo</Label>
              <Input value={anoLetivo} onChange={(e) => setAnoLetivo(e.target.value)} className="rounded-xl" />
            </div>
          ) : (
            extraLabel && (
              <div className="space-y-2">
                <Label>{extraLabel}</Label>
                <Input value={extra} onChange={(e) => setExtra(e.target.value)} className="rounded-xl" />
              </div>
            )
          )}
          {item.email && (
            <p className="text-xs text-muted-foreground">E-mail: {item.email}</p>
          )}
        </div>
      )}

      {etapa === 1 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Nome" valor={nome} />
          {tipo === "turma" ? (
            <WizardResumoLinha rotulo="Ano letivo" valor={anoLetivo} />
          ) : (
            extra && <WizardResumoLinha rotulo={extraLabel} valor={extra} />
          )}
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}
