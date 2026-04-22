"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
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

export default function AvaliacoesMateriaPage({
  params,
}: {
  params: Promise<{ materia: string }>
}) {
  const { materia } = use(params)
  const router = useRouter()
  const { obterMateria, adicionarAssuntoNaMateria } = useAvaliacoes()
  const [dialogoNovoConteudoAberto, setDialogoNovoConteudoAberto] = React.useState(false)
  const [nomeNovaSecao, setNomeNovaSecao] = React.useState("")
  const materiaExiste = Boolean(obterMateria(materia))

  React.useEffect(() => {
    if (!materiaExiste) router.replace("/avaliacoes")
  }, [materiaExiste, router])

  if (!materiaExiste) return null

  return (
    <>
      <ModuloAvaliacoes
        materiaId={materia}
        cabecalhoExtrasMateria={
          <Button
            className="w-full gap-2 rounded-xl shadow-soft sm:w-auto"
            onClick={() => setDialogoNovoConteudoAberto(true)}
          >
            <Plus className="h-4 w-4" />
            Novo conteúdo
          </Button>
        }
      />

      <Dialog
        open={dialogoNovoConteudoAberto}
        onOpenChange={(aberto) => {
          setDialogoNovoConteudoAberto(aberto)
          if (!aberto) setNomeNovaSecao("")
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo conteúdo</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="nome-secao-materia">Nome da seção</Label>
            <Input
              id="nome-secao-materia"
              value={nomeNovaSecao}
              onChange={(e) => setNomeNovaSecao(e.target.value)}
              placeholder="Ex.: Álgebra"
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogoNovoConteudoAberto(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => {
                adicionarAssuntoNaMateria(materia, nomeNovaSecao)
                setNomeNovaSecao("")
                setDialogoNovoConteudoAberto(false)
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
