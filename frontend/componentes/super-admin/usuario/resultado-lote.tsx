"use client"

import type { LoteResultadoResponse } from "@/lib/api/dtos/configuracoes"

export function ResultadoLote({ resultado }: { resultado: LoteResultadoResponse | null }) {
  if (!resultado) return null
  if (resultado.sucesso.length === 0 && resultado.falhas.length === 0) return null
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
      {resultado.sucesso.length > 0 && (
        <p className="text-emerald-700 dark:text-emerald-400">
          {resultado.sucesso.length} operação(ões) concluída(s) com sucesso.
        </p>
      )}
      {resultado.falhas.map((f) => (
        <p key={f.id} className="text-destructive">
          {f.motivo}
        </p>
      ))}
    </div>
  )
}
