"use client"

import type { ElementType } from "react"

export function CampoInfo({
  icone: Icon,
  label,
  valor,
}: {
  icone: ElementType
  label: string
  valor: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{valor}</p>
      </div>
    </div>
  )
}
