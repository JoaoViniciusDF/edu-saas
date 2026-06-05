"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { PendenteUi } from "@/componentes/modulos/modulo-avaliacoes"
import { ProvedorAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import { ModalCriarMateriaWizard } from "@/componentes/modulos/wizards/modal-avaliacao-wizard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const ModuloAvaliacoes = dynamic(
  () =>
    import("@/componentes/modulos/modulo-avaliacoes").then((m) => ({
      default: m.ModuloAvaliacoes,
    })),
  {
    loading: () => (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    ),
  }
)

function AvaliacoesPageConteudo() {
  const router = useRouter()
  const [dialogoAberto, setDialogoAberto] = React.useState(false)
  const [pendentes, setPendentes] = React.useState<PendenteUi[]>([])

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

      <ModalCriarMateriaWizard
        aberto={dialogoAberto}
        onOpenChange={setDialogoAberto}
        onPendente={(item) => setPendentes((p) => [...p, item])}
        onPendenteRemover={(key) => setPendentes((p) => p.filter((x) => x.key !== key))}
        onCriado={(id) => router.push(`/avaliacoes/${id}`)}
      />

      <ModuloAvaliacoes omitirCabecalhoRaiz pendentes={pendentes} />
    </div>
  )
}

export default function AvaliacoesPage() {
  return (
    <ProvedorAvaliacoes>
      <AvaliacoesPageConteudo />
    </ProvedorAvaliacoes>
  )
}
