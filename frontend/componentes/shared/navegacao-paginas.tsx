"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NavegacaoPaginas({
  paginaAtual,
  totalPaginas,
  onAnterior,
  onProxima,
  rotuloPagina,
  className,
}: {
  paginaAtual: number
  totalPaginas: number
  onAnterior: () => void
  onProxima: () => void
  rotuloPagina?: string
  className?: string
}) {
  const naPrimeira = paginaAtual <= 0
  const naUltima = paginaAtual >= totalPaginas - 1

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5"
        disabled={naPrimeira}
        onClick={onAnterior}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <div className="text-center text-sm">
        {rotuloPagina ?? (
          <>
            <span className="font-semibold text-foreground">{paginaAtual + 1}</span>
            <span className="text-muted-foreground"> / {totalPaginas}</span>
          </>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5"
        disabled={naUltima}
        onClick={onProxima}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
