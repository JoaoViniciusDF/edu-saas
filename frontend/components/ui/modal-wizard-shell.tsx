"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Sparkles, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function WizardCardOption({
  selecionado,
  onClick,
  icone: Icone,
  label,
  descricao,
  corBorda = "border-primary/40 bg-primary/5 hover:border-primary",
}: {
  selecionado: boolean
  onClick: () => void
  icone: LucideIcon
  label: string
  descricao?: string
  corBorda?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all",
        corBorda,
        selecionado && "ring-2 ring-primary scale-[1.02]"
      )}
    >
      <Icone className="h-8 w-8" />
      <span className="font-semibold">{label}</span>
      {descricao && <span className="text-xs text-muted-foreground text-center">{descricao}</span>}
    </button>
  )
}

interface ModalWizardShellProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  etapas: string[]
  etapaAtual: number
  onEtapaAnterior: () => void
  onEtapaProxima: () => void
  podeAvancar: boolean
  onSubmit: () => void
  salvando?: boolean
  textoSubmit?: string
  textoProximo?: string
  icone?: LucideIcon
  onReset?: () => void
  children: React.ReactNode
}

export function ModalWizardShell({
  aberto,
  onOpenChange,
  titulo,
  etapas,
  etapaAtual,
  onEtapaAnterior,
  onEtapaProxima,
  podeAvancar,
  onSubmit,
  salvando = false,
  textoSubmit = "Confirmar",
  textoProximo = "Próximo",
  icone: Icone = Sparkles,
  onReset,
  children,
}: ModalWizardShellProps) {
  const ultimaEtapa = etapaAtual >= etapas.length - 1

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) onReset?.()
        onOpenChange(v)
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col rounded-3xl sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-soft">
            <Icone className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>{titulo}</DialogTitle>
          <Progress value={((etapaAtual + 1) / etapas.length) * 100} className="mt-3 h-2" />
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {etapas.map((e, i) => (
              <span key={e} className={cn(i <= etapaAtual && "font-semibold text-primary")}>
                {i + 1}. {e}
              </span>
            ))}
          </div>
        </DialogHeader>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1">{children}</div>

        <DialogFooter className="shrink-0 flex-row justify-between gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-1"
            disabled={etapaAtual === 0}
            onClick={onEtapaAnterior}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          {!ultimaEtapa ? (
            <Button
              className="rounded-xl gap-1 bg-gradient-to-br from-primary to-primary/80"
              disabled={!podeAvancar}
              onClick={onEtapaProxima}
            >
              {textoProximo}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="rounded-xl bg-gradient-to-br from-primary to-primary/80"
              disabled={salvando || !podeAvancar}
              onClick={() => void onSubmit()}
            >
              {salvando ? "Salvando..." : textoSubmit}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WizardResumo({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-5">
      {children}
    </div>
  )
}

export function WizardResumoLinha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <span className="font-medium text-right">{valor}</span>
    </div>
  )
}
