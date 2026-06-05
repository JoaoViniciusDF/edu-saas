"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BookMarked, Layers } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ModalWizardShell,
  WizardResumo,
  WizardResumoLinha,
} from "@/components/ui/modal-wizard-shell"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import type { PendenteUi } from "@/componentes/modulos/modulo-avaliacoes"

export function ModalCriarMateriaWizard({
  aberto,
  onOpenChange,
  onCriado,
  onPendente,
  onPendenteRemover,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onCriado?: (id: string) => void
  onPendente?: (item: PendenteUi) => void
  onPendenteRemover?: (key: string) => void
}) {
  const { adicionarMateria } = useAvaliacoes()
  const [etapa, setEtapa] = React.useState(0)
  const [nome, setNome] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  const reset = () => {
    setEtapa(0)
    setNome("")
  }

  const salvar = async () => {
    const titulo = nome.trim() || "Nova matéria"
    const pendKey = `materia-${Date.now()}`
    onPendente?.({ key: pendKey, titulo, tipo: "materia" })
    setSalvando(true)
    try {
      const id = await adicionarMateria(titulo)
      toast.success("Matéria criada!")
      onPendenteRemover?.(pendKey)
      reset()
      onOpenChange(false)
      onCriado?.(id)
    } catch (e: unknown) {
      onPendenteRemover?.(pendKey)
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Nova matéria"
      etapas={["Nome", "Confirmar"]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={!!nome.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Criar matéria"
      icone={BookMarked}
      onReset={reset}
    >
      {etapa === 0 && (
        <div className="space-y-2">
          <Label>Nome da matéria *</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Química"
            className="rounded-xl"
          />
        </div>
      )}
      {etapa === 1 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Matéria" valor={nome} />
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}

export function ModalEditarMateriaWizard({
  materiaId,
  nomeInicial,
  aberto,
  onOpenChange,
}: {
  materiaId: string
  nomeInicial: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}) {
  const qc = useQueryClient()
  const [nome, setNome] = React.useState(nomeInicial)
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (aberto) setNome(nomeInicial)
  }, [aberto, nomeInicial])

  const salvar = async () => {
    setSalvando(true)
    try {
      await avaliacoesRequests.patchMateria(materiaId, { nome: nome.trim() })
      toast.success("Matéria atualizada!")
      void qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.materias() })
      void qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.arvore(materiaId) })
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Editar matéria"
      etapas={["Nome"]}
      etapaAtual={0}
      onEtapaAnterior={() => {}}
      onEtapaProxima={() => {}}
      podeAvancar={!!nome.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Salvar"
      icone={BookMarked}
    >
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
      </div>
    </ModalWizardShell>
  )
}

export function ModalCriarAssuntoWizard({
  materiaId,
  aberto,
  onOpenChange,
  onCriado,
  onPendente,
  onPendenteRemover,
}: {
  materiaId: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onCriado?: () => void
  onPendente?: (item: PendenteUi) => void
  onPendenteRemover?: (key: string) => void
}) {
  const { adicionarAssuntoNaMateria } = useAvaliacoes()
  const [etapa, setEtapa] = React.useState(0)
  const [nome, setNome] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  const reset = () => {
    setEtapa(0)
    setNome("")
  }

  const salvar = async () => {
    const titulo = nome.trim() || "Novo assunto"
    const pendKey = `assunto-${Date.now()}`
    onPendente?.({ key: pendKey, titulo, tipo: "assunto" })
    setSalvando(true)
    try {
      await adicionarAssuntoNaMateria(materiaId, titulo)
      toast.success("Assunto criado!")
      onPendenteRemover?.(pendKey)
      reset()
      onOpenChange(false)
      onCriado?.()
    } catch (e: unknown) {
      onPendenteRemover?.(pendKey)
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Novo assunto"
      etapas={["Nome", "Confirmar"]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={!!nome.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Criar"
      icone={Layers}
      onReset={reset}
    >
      {etapa === 0 && (
        <div className="space-y-2">
          <Label>Nome da seção *</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Álgebra"
            className="rounded-xl"
          />
        </div>
      )}
      {etapa === 1 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Seção" valor={nome} />
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}

export function ModalEditarAssuntoWizard({
  materiaId,
  assuntoId,
  nomeInicial,
  aberto,
  onOpenChange,
}: {
  materiaId: string
  assuntoId: string
  nomeInicial: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}) {
  const qc = useQueryClient()
  const [nome, setNome] = React.useState(nomeInicial)
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (aberto) setNome(nomeInicial)
  }, [aberto, nomeInicial])

  const salvar = async () => {
    setSalvando(true)
    try {
      await avaliacoesRequests.patchAssunto(assuntoId, { nome: nome.trim() })
      toast.success("Assunto atualizado!")
      void qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.arvore(materiaId) })
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Editar assunto"
      etapas={["Nome"]}
      etapaAtual={0}
      onEtapaAnterior={() => {}}
      onEtapaProxima={() => {}}
      podeAvancar={!!nome.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Salvar"
      icone={Layers}
    >
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
      </div>
    </ModalWizardShell>
  )
}
