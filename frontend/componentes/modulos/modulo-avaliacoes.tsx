"use client"

import * as React from "react"
import {
  BookMarked,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Copy,
  FileQuestion,
  FolderOpen,
  GripVertical,
  Layers,
  Lock,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  User,
  Wand2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AvaliacaoListaItem, StatusAvaliacao } from "@/lib/avaliacoes/dados"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface MensagemChat {
  id: string
  tipo: "usuario" | "assistente"
  conteudo: string
}

interface Questao {
  id: string
  tipo: "multipla-escolha" | "texto-aberto"
  pergunta: string
  alternativas?: string[]
  respostaCorreta?: number
}

const mensagensIniciais: MensagemChat[] = [
  {
    id: "1",
    tipo: "assistente",
    conteudo:
      "Olá! Sou seu assistente de avaliações. Posso ajudar você a gerar questões e revisar a prova.",
  },
]

const questoesTemplate: Questao[] = [
  {
    id: "q1",
    tipo: "multipla-escolha",
    pergunta: "Qual é a fórmula de Bhaskara para encontrar as raízes de uma equação de 2º grau?",
    alternativas: [
      "x = (-b ± √(b² - 4ac)) / 2a",
      "x = (b ± √(b² - 4ac)) / 2a",
      "x = (-b ± √(b² + 4ac)) / 2a",
      "x = (-b ± √(4ac - b²)) / 2a",
    ],
    respostaCorreta: 0,
  },
  {
    id: "q2",
    tipo: "multipla-escolha",
    pergunta: "O discriminante (Δ) de uma equação de 2º grau determina:",
    alternativas: [
      "O valor da raiz",
      "A quantidade e natureza das raízes",
      "O coeficiente angular",
      "A soma das raízes",
    ],
    respostaCorreta: 1,
  },
  {
    id: "q3",
    tipo: "texto-aberto",
    pergunta:
      "Explique com suas palavras o que acontece quando o discriminante (Δ) é igual a zero em uma equação de 2º grau.",
  },
]

const detalhesPorAvaliacaoId: Record<
  string,
  { tituloPainel: string; questoes: Questao[]; status: StatusAvaliacao }
> = {
  "f1c90946-9a84-4318-b4d6-b8c2b7f7f57d": {
    tituloPainel: "Funções — revisão",
    status: "rascunho",
    questoes: questoesTemplate,
  },
  "c2d3e391-e2b8-4846-ba87-7f01a0b0fe53": {
    tituloPainel: "Funções — aplicação",
    status: "publicada",
    questoes: questoesTemplate.slice(0, 2),
  },
  "2f8de84f-0350-4c47-b5ab-33387967afcf": {
    tituloPainel: "Geometria plana",
    status: "encerrada",
    questoes: questoesTemplate,
  },
  "dd42d81c-a89d-4e8b-a5f9-41216afcef58": {
    tituloPainel: "PA e PG — rascunho",
    status: "rascunho",
    questoes: questoesTemplate.slice(0, 2),
  },
  "f2df77f1-c032-4359-89d4-6af2b5f68e7e": {
    tituloPainel: "Lista PA/PG",
    status: "publicada",
    questoes: questoesTemplate.slice(0, 1),
  },
  "1bf35dfc-c0ca-47e5-8901-a570a8a9e8e6": {
    tituloPainel: "Classificação de polígonos",
    status: "rascunho",
    questoes: questoesTemplate.slice(0, 1),
  },
  "3564313b-2ab2-4996-ab20-32e2e9465d15": {
    tituloPainel: "Leis de Newton",
    status: "publicada",
    questoes: questoesTemplate,
  },
}

function badgeStatus(status: StatusAvaliacao) {
  switch (status) {
    case "rascunho":
      return (
        <Badge variant="secondary" className="rounded-full text-xs">
          Rascunho
        </Badge>
      )
    case "publicada":
      return <Badge className="rounded-full bg-primary/90 text-xs">Publicada</Badge>
    case "encerrada":
      return (
        <Badge variant="outline" className="rounded-full text-xs">
          Encerrada
        </Badge>
      )
    default:
      return null
  }
}

/** Padding horizontal único do painel da IA (header, mensagens e input alinhados) */
const iaPainelPadX = "px-4 sm:px-5 lg:px-6"

function PainelAssistenteIA({
  mensagens,
  inputMensagem,
  setInputMensagem,
  enviarMensagem,
  aoFecharMobile,
  minimizado,
  onAlternarMinimizar,
}: {
  mensagens: MensagemChat[]
  inputMensagem: string
  setInputMensagem: (v: string) => void
  enviarMensagem: () => void
  aoFecharMobile: () => void
  minimizado: boolean
  onAlternarMinimizar: () => void
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col border-border/50 bg-card/50 backdrop-blur-xl",
        minimizado ? "h-auto" : "h-full min-h-0"
      )}
    >
      <div
        className={cn(
          "shrink-0 border-b border-border/50 bg-card/50 py-3 backdrop-blur-xl",
          iaPainelPadX
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-soft">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-tight">Assistente IA</h3>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={onAlternarMinimizar}
            aria-expanded={!minimizado}
            aria-label={minimizado ? "Maximizar assistente" : "Minimizar assistente"}
          >
            {minimizado ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-0 w-full overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          minimizado
            ? "pointer-events-none grid-rows-[0fr] opacity-0"
            : "min-h-0 flex-1 grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <ScrollArea className="min-h-0 flex-1 basis-0">
          <div className={cn("space-y-4 py-4", iaPainelPadX)}>
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.tipo === "usuario" ? "justify-end" : "justify-start")}
              >
                {msg.tipo === "assistente" && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.tipo === "usuario"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border/50 bg-secondary/80"
                  )}
                >
                  {msg.conteudo}
                </div>
                {msg.tipo === "usuario" && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
          </ScrollArea>

          <div className={cn("shrink-0 border-t border-border/50 bg-card/50 py-4", iaPainelPadX)}>
          <div className="mb-2 flex justify-end lg:hidden">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={aoFecharMobile}>
              Fechar
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Peça à IA para gerar ou ajustar o quiz..."
              value={inputMensagem}
              onChange={(e) => setInputMensagem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
              className="h-11 rounded-xl border-transparent bg-secondary/50 text-sm focus:border-primary/30"
            />
            <Button
              size="icon"
              onClick={enviarMensagem}
              className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-soft"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ModuloAvaliacoesProps {
  materiaId?: string
  conteudoId?: string
  avaliacaoId?: string
  /** Quando true, em /avaliacoes a página já mostra o título; só a grelha de matérias. */
  omitirCabecalhoRaiz?: boolean
  /** Fragmento à direita do título da matéria (ex.: botão Novo Conteúdo na página). */
  cabecalhoExtrasMateria?: React.ReactNode
}

export function ModuloAvaliacoes({
  materiaId,
  conteudoId,
  avaliacaoId,
  omitirCabecalhoRaiz,
  cabecalhoExtrasMateria,
}: ModuloAvaliacoesProps = {}) {
  const router = useRouter()
  const {
    materias,
    obterMateria,
    obterContextoRota,
    adicionarConteudoNoAssunto,
  } = useAvaliacoes()

  const [mensagens, setMensagens] = React.useState<MensagemChat[]>(mensagensIniciais)
  const [questoes, setQuestoes] = React.useState<Questao[]>([])
  const [tituloAvaliacao, setTituloAvaliacao] = React.useState("Nova avaliação")
  const [inputMensagem, setInputMensagem] = React.useState("")
  const [dataEntrega, setDataEntrega] = React.useState<Date>()
  const [painelIAAberto, setPainelIAAberto] = React.useState(false)
  const [painelIAMinimizado, setPainelIAMinimizado] = React.useState(false)
  const [modoEdicao, setModoEdicao] = React.useState(true)
  const [origemUrl, setOrigemUrl] = React.useState("")
  const [pendenciaNovaPasta, setPendenciaNovaPasta] = React.useState<{
    materiaId: string
    assuntoId: string
  } | null>(null)
  const [nomeNovaPasta, setNomeNovaPasta] = React.useState("")

  React.useEffect(() => {
    setOrigemUrl(window.location.origin)
  }, [])

  const materiaAtual = materiaId ? obterMateria(materiaId) : null
  const contextoConteudo =
    materiaId && conteudoId ? obterContextoRota(materiaId, conteudoId) : null

  const avaliacaoAtual =
    contextoConteudo && avaliacaoId && avaliacaoId !== "nova"
      ? contextoConteudo.conteudo.avaliacoes.find((item) => item.id === avaliacaoId) ?? null
      : null

  React.useEffect(() => {
    if (!avaliacaoId || !materiaId || !conteudoId) return
    const ctx = obterContextoRota(materiaId, conteudoId)
    if (!ctx) return

    if (avaliacaoId === "nova") {
      setModoEdicao(true)
      setTituloAvaliacao("Nova avaliação")
      setQuestoes([])
      setMensagens(mensagensIniciais)
      return
    }

    const av = ctx.conteudo.avaliacoes.find((item) => item.id === avaliacaoId)
    if (!av) return

    const detalhes = detalhesPorAvaliacaoId[av.id]
    const podeEditar = av.status === "rascunho"
    setModoEdicao(podeEditar)
    setTituloAvaliacao(detalhes?.tituloPainel ?? av.titulo)
    const baseQuestoes = detalhes?.questoes ?? questoesTemplate
    setQuestoes(
      baseQuestoes.map((q) => ({
        ...q,
        alternativas: q.alternativas ? [...q.alternativas] : undefined,
        id: `${av.id}-${q.id}`,
      }))
    )
    setMensagens([
      ...mensagensIniciais,
      ...(podeEditar
        ? []
        : [
            {
              id: "lock",
              tipo: "assistente" as const,
              conteudo: "Esta avaliação está em modo leitura. Apenas rascunhos podem ser editados.",
            },
          ]),
    ])
  }, [avaliacaoId, materiaId, conteudoId, obterContextoRota])

  const copiarLink = async (url: string) => {
    if (!navigator?.clipboard) return
    await navigator.clipboard.writeText(url)
  }

  const enviarMensagem = () => {
    if (!inputMensagem.trim()) return
    setMensagens((prev) => [
      ...prev,
      { id: Date.now().toString(), tipo: "usuario", conteudo: inputMensagem },
    ])
    setInputMensagem("")
    setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          tipo: "assistente" as const,
          conteudo: "Solicitação recebida. Vou ajustar a prova com base no seu pedido.",
        },
      ])
    }, 700)
  }

  const adicionarQuestao = () => {
    if (!modoEdicao) return
    setQuestoes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        tipo: "multipla-escolha",
        pergunta: "Nova questão",
        alternativas: ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
        respostaCorreta: 0,
      },
    ])
  }

  const removerQuestao = (id: string) => {
    if (!modoEdicao) return
    setQuestoes((prev) => prev.filter((q) => q.id !== id))
  }

  const dialogoNovaPasta = (
    <Dialog
      open={!!pendenciaNovaPasta}
      onOpenChange={(aberto) => {
        if (!aberto) {
          setPendenciaNovaPasta(null)
          setNomeNovaPasta("")
        }
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova pasta de avaliações</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="nome-pasta-avaliacoes">Nome da pasta</Label>
          <Input
            id="nome-pasta-avaliacoes"
            value={nomeNovaPasta}
            onChange={(e) => setNomeNovaPasta(e.target.value)}
            placeholder="Ex.: Prova 1 — funções"
            className="rounded-xl"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setPendenciaNovaPasta(null)
              setNomeNovaPasta("")
            }}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => {
              if (!pendenciaNovaPasta) return
              const { materiaId: mid, assuntoId: aid } = pendenciaNovaPasta
              const novoId = adicionarConteudoNoAssunto(mid, aid, nomeNovaPasta)
              setPendenciaNovaPasta(null)
              setNomeNovaPasta("")
              if (novoId) router.push(`/avaliacoes/${mid}/${novoId}`)
            }}
          >
            Criar e abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!materiaId) {
    const grelha = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {materias.map((materia) => (
          <div
            key={materia.id}
            className="group flex items-center gap-4 rounded-3xl border border-border/50 bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-soft-lg"
          >
            <button
              type="button"
              onClick={() => router.push(`/avaliacoes/${materia.id}`)}
              className="flex min-w-0 flex-1 items-center gap-4 text-left"
            >
              <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-soft", materia.cor)}>
                <BookMarked className="h-7 w-7 text-white/90" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-foreground">{materia.nome}</h2>
                <p className="text-xs text-muted-foreground">
                  {materia.assuntos.length} assuntos · {materia.conteudosCount} conteúdos
                </p>
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-xl"
                title="Nova pasta de avaliações nesta matéria"
                onClick={(e) => {
                  e.stopPropagation()
                  const primeiroAssunto = materia.assuntos[0]
                  if (!primeiroAssunto) return
                  setNomeNovaPasta("")
                  setPendenciaNovaPasta({ materiaId: materia.id, assuntoId: primeiroAssunto.id })
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>
    )

    if (omitirCabecalhoRaiz) {
      return (
        <>
          {grelha}
          {dialogoNovaPasta}
        </>
      )
    }

    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-[calc(100vh-5rem)] lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Avaliações por matéria
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Escolha uma matéria para abrir seus conteúdos e avaliações.
          </p>
        </div>
        {grelha}
        {dialogoNovaPasta}
      </div>
    )
  }

  if (!materiaAtual) return null

  if (!conteudoId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-[calc(100vh-5rem)] lg:p-8">
        <div className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <button type="button" onClick={() => router.push("/avaliacoes")} className="rounded-lg font-medium text-foreground hover:underline">
            Avaliações
          </button>
          <ChevronRight className="mx-1 h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">{materiaAtual.nome}</span>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              {materiaAtual.nome}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Escolha um conteúdo para abrir as avaliações e compartilhar links diretos.
            </p>
          </div>
          {cabecalhoExtrasMateria ? (
            <div className="flex w-full shrink-0 justify-end sm:w-auto">{cabecalhoExtrasMateria}</div>
          ) : null}
        </div>

        <div className="space-y-8">
          {materiaAtual.assuntos.map((assunto) => (
            <section key={assunto.id}>
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{assunto.nome}</h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  title="Nova pasta de avaliações neste assunto"
                  onClick={() => {
                    setNomeNovaPasta("")
                    setPendenciaNovaPasta({ materiaId: materiaAtual.id, assuntoId: assunto.id })
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {assunto.conteudos.map((conteudo) => (
                  <button
                    key={conteudo.id}
                    type="button"
                    onClick={() => router.push(`/avaliacoes/${materiaAtual.id}/${conteudo.id}`)}
                    className="group rounded-3xl border border-border/50 bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-soft-lg"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold">{conteudo.nome}</h3>
                          <p className="text-xs text-muted-foreground">{conteudo.statusResumo}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        {dialogoNovaPasta}
      </div>
    )
  }

  if (!contextoConteudo) return null

  if (!avaliacaoId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-[calc(100vh-5rem)] lg:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button type="button" onClick={() => router.push("/avaliacoes")} className="rounded-lg font-medium text-foreground hover:underline">
            Avaliações
          </button>
          <ChevronRight className="mx-1 h-4 w-4 shrink-0" />
          <button type="button" onClick={() => router.push(`/avaliacoes/${materiaAtual.id}`)} className="rounded-lg font-medium text-foreground hover:underline">
            {materiaAtual.nome}
          </button>
          <ChevronRight className="mx-1 h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">{contextoConteudo.conteudo.nome}</span>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                {contextoConteudo.conteudo.nome}
              </h1>
            </div>
            <Button
              className="rounded-xl shadow-soft"
              onClick={() => router.push(`/avaliacoes/${materiaAtual.id}/${contextoConteudo.conteudo.id}/nova`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova avaliação
            </Button>
          </div>

          <div className="space-y-3">
            {contextoConteudo.conteudo.avaliacoes.map((avaliacao: AvaliacaoListaItem) => {
              const url = `${origemUrl}/avaliacoes/${materiaAtual.id}/${contextoConteudo.conteudo.id}/${avaliacao.id}`
              return (
                <div key={avaliacao.id} className="rounded-2xl border border-border/50 bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => router.push(`/avaliacoes/${materiaAtual.id}/${contextoConteudo.conteudo.id}/${avaliacao.id}`)}
                      className="min-w-0 text-left"
                    >
                      <h3 className="truncate font-semibold">{avaliacao.titulo}</h3>
                      <p className="text-xs text-muted-foreground">
                        {avaliacao.alunosFeitos}/{avaliacao.alunosTotal} alunos responderam
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      {badgeStatus(avaliacao.status)}
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => copiarLink(url)}>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copiar link
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/50 bg-card/80 px-4 py-3 backdrop-blur-xl lg:flex-nowrap lg:px-6">
        <div className="flex min-w-fit items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 rounded-xl"
            onClick={() => router.push(`/avaliacoes/${materiaAtual.id}/${contextoConteudo.conteudo.id}`)}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          {!modoEdicao && (
            <Badge variant="outline" className="gap-1 rounded-full text-xs">
              <Lock className="h-3 w-3" />
              Somente leitura
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl text-xs sm:text-sm" disabled={!modoEdicao}>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span> rascunho
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 max-w-[200px] gap-2 rounded-xl text-xs sm:text-sm"
            disabled={!modoEdicao}
            title="Conteúdo atual da prova"
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">{contextoConteudo.conteudo.nome}</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl text-xs sm:text-sm" disabled={!modoEdicao}>
                <Calendar className="h-4 w-4" />
                {dataEntrega ? format(dataEntrega, "dd/MM", { locale: ptBR }) : "Prazo"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl p-0 shadow-soft-lg" align="start">
              <CalendarComponent
                mode="single"
                selected={dataEntrega}
                onSelect={setDataEntrega}
                locale={ptBR}
                initialFocus
                className="rounded-2xl"
              />
            </PopoverContent>
          </Popover>
          <Button className="h-10 gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-xs shadow-soft sm:text-sm" disabled={!modoEdicao}>
            <CheckCircle2 className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>

      {/* Mesmo recuo horizontal à direita do header (px-6 em lg), para a coluna do chat coincidir com a área útil */}
      <div className="relative flex min-h-0 flex-1 flex-col pr-4 lg:flex-row lg:items-stretch lg:pr-6">
        {/* Editor no centro: order menor que o painel da IA no desktop (flex: 0 = esquerda, 1 = direita estava invertido) */}
        <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:border-r lg:border-border/50">
          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor="titulo-avaliacao">
                    Título da avaliação
                  </label>
                  <Input
                    id="titulo-avaliacao"
                    value={tituloAvaliacao}
                    onChange={(e) => modoEdicao && setTituloAvaliacao(e.target.value)}
                    readOnly={!modoEdicao}
                    className="border-transparent bg-transparent text-xl font-bold tracking-tight focus-visible:ring-primary/30 sm:text-2xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {modoEdicao
                      ? "Edite as questões no centro e converse com o assistente à direita."
                      : "Visualização da avaliação publicada ou encerrada."}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit shrink-0 rounded-full px-4 py-1.5 text-sm">
                  {questoes.length} {questoes.length === 1 ? "questão" : "questões"}
                </Badge>
              </div>

              {questoes.length === 0 && modoEdicao && (
                <Card className="rounded-2xl border-dashed border-border/60 bg-secondary/20">
                  <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <FileQuestion className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Comece adicionando questões ou peça ajuda ao assistente IA.
                    </p>
                    <Button className="rounded-xl" onClick={adicionarQuestao}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar primeira questão
                    </Button>
                  </CardContent>
                </Card>
              )}

              {questoes.map((questao, index) => (
                <Card
                  key={questao.id}
                  className="group relative overflow-hidden rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-soft"
                >
                  <div className="absolute bottom-0 left-0 top-0 flex w-10 cursor-grab items-center justify-center bg-gradient-to-r from-secondary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardHeader className="pb-4 pl-12 sm:pl-14">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <Badge variant={questao.tipo === "multipla-escolha" ? "default" : "secondary"} className="rounded-full text-xs">
                          {questao.tipo === "multipla-escolha" ? "Múltipla Escolha" : "Texto Aberto"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        disabled={!modoEdicao}
                        onClick={() => removerQuestao(questao.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pl-12 sm:pl-14">
                    <Textarea
                      value={questao.pergunta}
                      onChange={(e) => {
                        if (!modoEdicao) return
                        setQuestoes((qs) => qs.map((q) => (q.id === questao.id ? { ...q, pergunta: e.target.value } : q)))
                      }}
                      readOnly={!modoEdicao}
                      className="min-h-[80px] resize-none rounded-xl border-transparent bg-secondary/30 text-base font-medium focus:border-primary/30"
                    />
                    {questao.tipo === "multipla-escolha" && questao.alternativas && (
                      <div className="space-y-2.5">
                        {questao.alternativas.map((alternativa, alternativaIndex) => (
                          <div key={alternativaIndex} className="group/alt flex items-center gap-3">
                            <button
                              type="button"
                              disabled={!modoEdicao}
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                questao.respostaCorreta === alternativaIndex
                                  ? "scale-110 border-primary bg-primary"
                                  : "border-muted-foreground/30 hover:border-primary/50 group-hover/alt:border-primary/30"
                              )}
                              onClick={() =>
                                setQuestoes((qs) =>
                                  qs.map((q) =>
                                    q.id === questao.id ? { ...q, respostaCorreta: alternativaIndex } : q
                                  )
                                )
                              }
                            >
                              {questao.respostaCorreta === alternativaIndex && (
                                <Circle className="h-2.5 w-2.5 fill-primary-foreground text-primary-foreground" />
                              )}
                            </button>
                            <Input
                              value={alternativa}
                              onChange={(e) => {
                                if (!modoEdicao) return
                                setQuestoes((qs) =>
                                  qs.map((q) => {
                                    if (q.id !== questao.id || !q.alternativas) return q
                                    const novasAlternativas = [...q.alternativas]
                                    novasAlternativas[alternativaIndex] = e.target.value
                                    return { ...q, alternativas: novasAlternativas }
                                  })
                                )
                              }}
                              readOnly={!modoEdicao}
                              className="h-11 flex-1 rounded-xl border-transparent bg-secondary/30 focus:border-primary/30"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {questao.tipo === "texto-aberto" && (
                      <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-secondary/20 p-6 text-center">
                        <p className="text-sm text-muted-foreground">Campo de resposta aberta para o aluno</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {modoEdicao && questoes.length > 0 && (
                <Button
                  variant="outline"
                  className="h-16 w-full gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                  onClick={adicionarQuestao}
                >
                  <Plus className="h-5 w-5" />
                  Adicionar nova questão
                </Button>
              )}
            </div>
          </ScrollArea>
        </div>

        <div
          className={cn(
            /* Desktop: coluna com altura da linha; minimizado só a faixa do cabeçalho */
            "fixed inset-0 z-40 flex h-full min-h-0 shrink-0 lg:static lg:z-auto lg:order-2 lg:w-88 xl:w-96",
            painelIAMinimizado ? "lg:h-auto lg:self-end" : "lg:h-full lg:min-h-0 lg:self-stretch",
            !painelIAAberto && "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100"
          )}
        >
          <button
            type="button"
            className="flex-1 bg-black/40 lg:hidden"
            aria-label="Fechar assistente"
            onClick={() => setPainelIAAberto(false)}
          />
          <div
            className={cn(
              "flex min-h-0 w-full max-w-md flex-col border-border/50 bg-card shadow-soft-lg transition-transform duration-300 lg:max-w-none lg:border-l-0 lg:shadow-none",
              painelIAMinimizado ? "h-auto lg:h-auto" : "h-full min-h-0",
              !painelIAAberto && "translate-x-full lg:translate-x-0"
            )}
          >
            <PainelAssistenteIA
              mensagens={mensagens}
              inputMensagem={inputMensagem}
              setInputMensagem={setInputMensagem}
              enviarMensagem={enviarMensagem}
              aoFecharMobile={() => setPainelIAAberto(false)}
              minimizado={painelIAMinimizado}
              onAlternarMinimizar={() => setPainelIAMinimizado((v) => !v)}
            />
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            size="lg"
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-soft-lg"
            onClick={() => {
              setPainelIAMinimizado(false)
              setPainelIAAberto(true)
            }}
          >
            <Wand2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
