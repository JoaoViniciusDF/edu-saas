"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Sparkles } from "lucide-react"
import { ModuloAvaliacoes } from "@/componentes/modulos/modulo-avaliacoes"
import { ModalCriarAssuntoWizard } from "@/componentes/modulos/wizards/modal-avaliacao-wizard"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import { ChatIaProva, IA_PENDENTE_KEY } from "@/componentes/avaliacoes/chat-ia-prova"
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
  const [chatAberto, setChatAberto] = React.useState(false)
  const [pendentes, setPendentes] = React.useState<
    import("@/componentes/modulos/modulo-avaliacoes").PendenteUi[]
  >([])
  const materiaUi = obterMateria(materia)
  const materiaExiste = Boolean(materiaUi && materiaUi.assuntos[0]?.id !== "_loading")

  React.useEffect(() => {
    if (carregando || materiaAtivaCarregando) return
    if (!materiaUi) router.replace("/avaliacoes")
  }, [materiaExiste, materiaUi, carregando, materiaAtivaCarregando, router])

  // Cria o rascunho e abre o editor, repassando o pedido para a IA montar a
  // prova ao vivo lá. As questões aparecem na tela do editor em tempo real.
  const lancarComIa = React.useCallback(
    async (corpo: { mensagem: string }, refs: { kind: "pasta" | "material"; id: string; nome: string }[]) => {
      const primeiroConteudo = materiaUi?.assuntos.flatMap((a) => a.conteudos)[0]
      if (!primeiroConteudo) {
        toast.error("Crie um assunto/pasta nesta matéria antes de gerar uma prova com IA.")
        return
      }
      window.sessionStorage.setItem(
        IA_PENDENTE_KEY,
        JSON.stringify({ mensagem: corpo.mensagem, refs })
      )
      router.push(`/avaliacoes/${materia}/${primeiroConteudo.id}/nova`)
    },
    [materiaUi, materia, router]
  )

  if (carregando || materiaAtivaCarregando || !materiaUi) return null

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:min-h-[calc(100vh-5rem)] lg:flex-row">
        <div className="min-w-0 flex-1">
          <ModuloAvaliacoes
            materiaId={materia}
            pendentes={pendentes}
            cabecalhoExtrasMateria={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl sm:w-auto"
                  onClick={() => setChatAberto((v) => !v)}
                >
                  <Sparkles className="h-4 w-4" />
                  Criar com IA
                </Button>
                <Button
                  className="w-full gap-2 rounded-xl shadow-soft sm:w-auto"
                  onClick={() => setDialogoNovoAssuntoAberto(true)}
                >
                  <Plus className="h-4 w-4" />
                  Novo assunto
                </Button>
              </div>
            }
          />
        </div>

        {chatAberto && (
          <div className="border-t border-border/60 lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)] lg:border-t-0">
            <ChatIaProva
              avaliacaoId={null}
              onQuestao={() => {}}
              onFechar={() => setChatAberto(false)}
              onLancar={lancarComIa}
            />
          </div>
        )}
      </div>

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
