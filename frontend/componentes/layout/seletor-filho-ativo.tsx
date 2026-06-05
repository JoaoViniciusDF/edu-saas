"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFilhoAtivo } from "@/componentes/provedores/provedor-filho-ativo"

export function SeletorFilhoAtivo() {
  const { alunoAtivoId, filhos, setAlunoAtivoId, carregando } = useFilhoAtivo()

  if (filhos.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">Filho:</span>
      <Select
        value={alunoAtivoId ?? undefined}
        onValueChange={setAlunoAtivoId}
        disabled={carregando}
      >
        <SelectTrigger className="h-9 w-[180px] rounded-xl text-sm">
          <SelectValue placeholder="Selecione o filho" />
        </SelectTrigger>
        <SelectContent>
          {filhos.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
