"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { ModuloAvaliacoes } from "@/componentes/modulos/modulo-avaliacoes"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AvaliacoesPage() {
  const router = useRouter()
  const { adicionarMateria } = useAvaliacoes()
  const [dialogoAberto, setDialogoAberto] = React.useState(false)
  const [nomeNovaMateria, setNomeNovaMateria] = React.useState("")

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-[calc(100vh-5rem)] lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Avaliações por matéria
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Escolha uma matéria para abrir seus conteúdos e avaliações.
          </p>
        </div>
        <Button
          className="w-full shrink-0 gap-2 rounded-xl shadow-soft sm:w-auto"
          onClick={() => setDialogoAberto(true)}
        >
          <Plus className="h-4 w-4" />
          Nova matéria
        </Button>
      </div>

      <Dialog
        open={dialogoAberto}
        onOpenChange={(aberto) => {
          setDialogoAberto(aberto)
          if (!aberto) setNomeNovaMateria("")
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova matéria</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="nome-materia-raiz">Nome</Label>
            <Input
              id="nome-materia-raiz"
              value={nomeNovaMateria}
              onChange={(e) => setNomeNovaMateria(e.target.value)}
              placeholder="Ex.: Química"
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => {
                const id = adicionarMateria(nomeNovaMateria)
                setNomeNovaMateria("")
                setDialogoAberto(false)
                router.push(`/avaliacoes/${id}`)
              }}
            >
              Criar e abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModuloAvaliacoes omitirCabecalhoRaiz />
    </div>
  )
}
