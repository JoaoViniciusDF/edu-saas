"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { ModuloAvaliacoes } from "@/componentes/modulos/modulo-avaliacoes"
import { ModalCriarAssuntoWizard } from "@/componentes/modulos/wizards/modal-avaliacao-wizard"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import { Button } from "@/components/ui/button"

export default function AvaliacoesMateriaPage({
  params,
}: {
  params: Promise<{ materia: string }>
}) {
  const { materia } = use(params)
  const router = useRouter()
  const { obterMateria, carregando, materiaAtivaCarregando } = useAvaliacoes()
  const [dialogoNovoAssuntoAberto, setDialogoNovoAssuntoAberto] = React.useState(false)
  const [pendentes, setPendentes] = React.useState<
    import("@/componentes/modulos/modulo-avaliacoes").PendenteUi[]
  >([])
  const materiaUi = obterMateria(materia)
  const materiaExiste = Boolean(materiaUi && materiaUi.assuntos[0]?.id !== "_loading")

  React.useEffect(() => {
    if (carregando || materiaAtivaCarregando) return
    if (!materiaUi) router.replace("/avaliacoes")
  }, [materiaExiste, materiaUi, carregando, materiaAtivaCarregando, router])

  if (carregando || materiaAtivaCarregando || !materiaUi) return null

  return (
    <>
      <ModuloAvaliacoes
        materiaId={materia}
        pendentes={pendentes}
        cabecalhoExtrasMateria={
          <Button
            className="w-full gap-2 rounded-xl shadow-soft sm:w-auto"
            onClick={() => setDialogoNovoAssuntoAberto(true)}
          >
            <Plus className="h-4 w-4" />
            Novo assunto
          </Button>
        }
      />

      <ModalCriarAssuntoWizard
        materiaId={materia}
        aberto={dialogoNovoAssuntoAberto}
        onOpenChange={setDialogoNovoAssuntoAberto}
        onPendente={(item) => setPendentes((p) => [...p, item])}
        onPendenteRemover={(key) => setPendentes((p) => p.filter((x) => x.key !== key))}
      />
    </>
  )
}
