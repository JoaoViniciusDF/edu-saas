"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Coluna<T> = {
  key: string
  header: string
  render: (item: T) => React.ReactNode
}

type ListaCadastroProps<T> = {
  titulo: string
  itens: T[]
  colunas: Coluna<T>[]
  carregando?: boolean
  camposCriar: { name: string; label: string; type?: string }[]
  onCriar: (dados: Record<string, string>) => Promise<void>
}

export function ListaCadastro<T extends { id: string }>({
  titulo,
  itens,
  colunas,
  carregando,
  camposCriar,
  onCriar,
}: ListaCadastroProps<T>) {
  const [aberto, setAberto] = React.useState(false)
  const [form, setForm] = React.useState<Record<string, string>>({})
  const [erro, setErro] = React.useState<string | null>(null)
  const [salvando, setSalvando] = React.useState(false)

  const submit = async () => {
    setErro(null)
    setSalvando(true)
    try {
      await onCriar(form)
      setAberto(false)
      setForm({})
    } catch (e: unknown) {
      setErro((e as Error).message ?? "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <Button className="rounded-xl gap-2" onClick={() => setAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>
      <div className="rounded-2xl border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              {colunas.map((c) => (
                <TableHead key={c.key}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colunas.length} className="text-muted-foreground">
                  Nenhum registro.
                </TableCell>
              </TableRow>
            ) : (
              itens.map((item) => (
                <TableRow key={item.id}>
                  {colunas.map((c) => (
                    <TableCell key={c.key}>{c.render(item)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Novo cadastro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {camposCriar.map((campo) => (
              <div key={campo.name} className="space-y-1">
                <Label>{campo.label}</Label>
                <Input
                  type={campo.type ?? "text"}
                  value={form[campo.name] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [campo.name]: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
            ))}
            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" disabled={salvando} onClick={() => void submit()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
