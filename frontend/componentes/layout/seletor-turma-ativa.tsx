"use client"

import { Users } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTurmaAtiva } from "@/componentes/provedores/provedor-turma-ativa"

export function SeletorTurmaAtiva({ recolhido }: { recolhido?: boolean }) {
  const { turmaAtivaId, turmas, setTurmaAtivaId, carregando } = useTurmaAtiva()

  if (turmas.length === 0 && !carregando) return null

  if (recolhido) {
    return (
      <div className="mx-3 mb-4 flex justify-center" title="Turma ativa">
        <Users className="h-5 w-5 text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-3 mb-4 space-y-2 rounded-xl border border-border/50 bg-card/80 p-3">
      <p className="text-xs font-medium text-foreground">Turma ativa</p>
      <Select
        value={turmaAtivaId ?? undefined}
        onValueChange={setTurmaAtivaId}
        disabled={carregando || turmas.length === 0}
      >
        <SelectTrigger className="h-9 rounded-lg text-xs">
          <SelectValue placeholder="Selecione a turma" />
        </SelectTrigger>
        <SelectContent>
          {turmas.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Conteúdo, avaliações e dashboard refletem esta turma.
      </p>
    </div>
  )
}
