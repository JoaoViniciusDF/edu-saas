"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/errors"
import { upsertAvaliacaoNaArvore } from "@/lib/avaliacoes/cache-arvore"
import {
  BookMarked,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  CopyPlus,
  FileQuestion,
  FolderOpen,
  GripVertical,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
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
import type { AvaliacaoListaItem } from "@/lib/avaliacoes/tipos-ui"
import type { StatusAvaliacao } from "@/lib/api/dtos/common"
import { documentoDeTexto } from "@/lib/avaliacoes/documento"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { useAvaliacoes } from "@/componentes/modulos/avaliacoes-provedor"
import { useTurmaAtiva } from "@/componentes/provedores/provedor-turma-ativa"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CardPendente } from "@/components/ui/card-pendente"
import { PainelSubmissoesAvaliacao } from "@/componentes/modulos/painel-submissoes-avaliacao"

export type PendenteUi = {
  key: string
  titulo: string
  tipo: "materia" | "assunto" | "pasta" | "avaliacao"
}

interface Questao {
  id: string
  tipo: "multipla-escolha" | "texto-aberto"
  pergunta: string
  alternativas?: string[]
  respostaCorreta?: number
}

function questoesApiParaUi(
  questoes: import("@/lib/api/dtos/avaliacoes").QuestaoResponse[]
): Questao[] {
  return questoes.map((q) => ({
    id: q.id,
    tipo: q.tipo === "multipla_escolha" ? "multipla-escolha" : "texto-aberto",
    pergunta: q.enunciado,
    alternativas: q.alternativas ?? undefined,
    respostaCorreta: q.resposta_correta ?? undefined,
  }))
}

function questoesUiParaApi(questoes: Questao[]) {
  return questoes.map((q, i) => ({
    id: q.id.startsWith("new-") ? null : q.id,
    tipo: (q.tipo === "multipla-escolha" ? "multipla_escolha" : "texto_aberto") as
      | "multipla_escolha"
      | "texto_aberto",
    ordem: i + 1,
    enunciado: q.pergunta,
    conteudo: documentoDeTexto(q.pergunta),
    alternativas: q.alternativas ?? null,
    resposta_correta: q.respostaCorreta ?? null,
  }))
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
    case "inativa":
      return (
        <Badge variant="secondary" className="rounded-full text-xs">
          Inativa
        </Badge>
      )
    default:
      return null
  }
}

interface ModuloAvaliacoesProps {
  materiaId?: string
  conteudoId?: string
  avaliacaoId?: string
  /** Quando true, em /avaliacoes a página já mostra o título; só a grelha de matérias. */
  omitirCabecalhoRaiz?: boolean
  /** Fragmento à direita do título da matéria (ex.: botão Novo assunto na página). */
  cabecalhoExtrasMateria?: React.ReactNode
  pendentes?: PendenteUi[]
}

export function ModuloAvaliacoes({
  materiaId,
  conteudoId,
  avaliacaoId,
  omitirCabecalhoRaiz,
  cabecalhoExtrasMateria,
  pendentes = [],
}: ModuloAvaliacoesProps = {}) {
  const router = useRouter()
  const qc = useQueryClient()
  const {
    materias,
    obterMateria,
    obterContextoRota,
    adicionarConteudoNoAssunto,
    invalidarArvore,
  } = useAvaliacoes()
  const { turmaAtivaId, turmas, setTurmaAtivaId } = useTurmaAtiva()
  const [modalPublicarAberto, setModalPublicarAberto] = React.useState(false)
  const [modalReabrirAberto, setModalReabrirAberto] = React.useState(false)
  const [confirmacao, setConfirmacao] = React.useState<{
    titulo: string
    descricao: string
    acao: () => Promise<void>
  } | null>(null)
  const [turmaPublicarId, setTurmaPublicarId] = React.useState<string>("")

  const [questoes, setQuestoes] = React.useState<Questao[]>([])
  const [tituloAvaliacao, setTituloAvaliacao] = React.useState("Nova avaliação")
  const [dataEntrega, setDataEntrega] = React.useState<Date>()
  const [modoEdicao, setModoEdicao] = React.useState(true)
  const [origemUrl, setOrigemUrl] = React.useState("")
  const [pendenciaNovaPasta, setPendenciaNovaPasta] = React.useState<{
    materiaId: string
    assuntoId: string
  } | null>(null)
  const [nomeNovaPasta, setNomeNovaPasta] = React.useState("")
  const [pendentesLocais, setPendentesLocais] = React.useState<PendenteUi[]>([])
  const todosPendentes = React.useMemo(
    () => [...pendentes, ...pendentesLocais],
    [pendentes, pendentesLocais]
  )

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

  const { data: detalheApi } = useQuery({
    queryKey: queryKeys.avaliacoes.detalhe(avaliacaoId ?? ""),
    queryFn: () => avaliacoesRequests.getAvaliacao(avaliacaoId!),
    enabled: !!avaliacaoId && avaliacaoId !== "nova" && !!materiaId && !!conteudoId,
  })

  React.useEffect(() => {
    if (!avaliacaoId || !materiaId || !conteudoId) return

    if (avaliacaoId === "nova") {
      setModoEdicao(true)
      setTituloAvaliacao("Nova avaliação")
      setQuestoes([])
      return
    }

    if (!detalheApi) return
    const podeEditar = detalheApi.status === "rascunho"
    setModoEdicao(podeEditar)
    setTituloAvaliacao(detalheApi.titulo)
    setQuestoes(questoesApiParaUi(detalheApi.questoes))
    if (detalheApi.prazo_utc) setDataEntrega(new Date(detalheApi.prazo_utc))
  }, [avaliacaoId, materiaId, conteudoId, detalheApi])

  const garantirAvaliacaoId = async (): Promise<string | null> => {
    if (!contextoConteudo || !materiaId || !conteudoId) return null
    if (avaliacaoId && avaliacaoId !== "nova") return avaliacaoId
    try {
      const criada = await avaliacoesRequests.createAvaliacao(contextoConteudo.conteudo.id, {
        titulo: tituloAvaliacao.trim() || "Nova avaliação",
        prazo_utc: dataEntrega?.toISOString(),
      })
      const cor = materiaAtual?.cor ?? "from-blue-500 to-blue-600"
      qc.setQueryData(queryKeys.avaliacoes.detalhe(criada.id), criada)
      upsertAvaliacaoNaArvore(
        qc,
        materiaId,
        conteudoId,
        criada,
        cor,
        turmaAtivaId
      )
      await invalidarArvore(materiaId)
      router.replace(`/avaliacoes/${materiaId}/${conteudoId}/${criada.id}`)
      return criada.id
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível criar a avaliação")
      return null
    }
  }

  const criarNovaAvaliacao = async () => {
    if (!materiaAtual || !contextoConteudo) return
    try {
      const criada = await avaliacoesRequests.createAvaliacao(contextoConteudo.conteudo.id, {
        titulo: "Nova avaliação",
      })
      qc.setQueryData(queryKeys.avaliacoes.detalhe(criada.id), criada)
      upsertAvaliacaoNaArvore(
        qc,
        materiaAtual.id,
        contextoConteudo.conteudo.id,
        criada,
        materiaAtual.cor,
        turmaAtivaId
      )
      await invalidarArvore(materiaAtual.id)
      router.push(
        `/avaliacoes/${materiaAtual.id}/${contextoConteudo.conteudo.id}/${criada.id}`
      )
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Não foi possível criar a avaliação")
    }
  }

  const salvarRascunho = async () => {
    if (!modoEdicao) return
    try {
      const id = await garantirAvaliacaoId()
      if (!id) return
      await avaliacoesRequests.patchAvaliacao(id, { titulo: tituloAvaliacao })
      await avaliacoesRequests.replaceQuestoes(id, {
        questoes: questoesUiParaApi(questoes),
      })
      await avaliacoesRequests.salvarRascunho(id)
      if (materiaId) await invalidarArvore(materiaId)
      toast.success("Rascunho salvo")
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao salvar rascunho")
    }
  }

  const abrirModalPublicar = () => {
    if (!modoEdicao) return
    if (questoes.length === 0) {
      toast.error("Adicione ao menos uma questão antes de publicar")
      return
    }
    setTurmaPublicarId(turmaAtivaId ?? turmas[0]?.id ?? "")
    setModalPublicarAberto(true)
  }

  const publicarAvaliacao = async () => {
    if (!modoEdicao || !turmaPublicarId) {
      toast.error("Selecione a turma para publicar")
      return
    }
    try {
      const id = await garantirAvaliacaoId()
      if (!id) return
      await avaliacoesRequests.patchAvaliacao(id, { titulo: tituloAvaliacao })
      await avaliacoesRequests.replaceQuestoes(id, {
        questoes: questoesUiParaApi(questoes),
      })
      await avaliacoesRequests.publicar(id, { turma_id: turmaPublicarId })
      setTurmaAtivaId(turmaPublicarId)
      if (materiaId) await invalidarArvore(materiaId)
      setModoEdicao(false)
      setModalPublicarAberto(false)
      toast.success("Avaliação publicada")
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao publicar — verifique o gabarito")
    }
  }

  const copiarLink = async (url: string) => {
    if (!navigator?.clipboard) return
    await navigator.clipboard.writeText(url)
  }

  const duplicarAvaliacao = async (id: string) => {
    if (!materiaId || !conteudoId) return
    try {
      const copia = await avaliacoesRequests.duplicar(id)
      await invalidarArvore(materiaId)
      toast.success("Avaliação duplicada")
      router.push(`/avaliacoes/${materiaId}/${conteudoId}/${copia.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao duplicar")
    }
  }

  // Atualiza a árvore/detalhe após uma ação. É best-effort: se o refetch
  // falhar, a ação (que já foi confirmada pelo backend) NÃO deve ser reportada
  // como erro — apenas atualizamos o cache quando possível.
  const atualizarCacheAvaliacao = async (id: string) => {
    try {
      if (materiaId) await invalidarArvore(materiaId)
      await qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.detalhe(id) })
    } catch {
      /* refetch de cache falhou; ação já concluída no servidor */
    }
  }

  const encerrarAvaliacao = async (id: string) => {
    try {
      await avaliacoesRequests.encerrar(id)
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao encerrar")
      return
    }
    setModoEdicao(false)
    toast.success("Avaliação encerrada")
    await atualizarCacheAvaliacao(id)
  }

  const inativarAvaliacao = async (id: string) => {
    try {
      await avaliacoesRequests.inativar(id)
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao inativar")
      return
    }
    toast.success("Avaliação inativada")
    await atualizarCacheAvaliacao(id)
  }

  const apagarAvaliacao = async (id: string) => {
    try {
      await avaliacoesRequests.apagar(id)
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao apagar")
      return
    }
    toast.success("Avaliação apagada permanentemente")
    try {
      if (materiaId) await invalidarArvore(materiaId)
    } catch {
      /* refetch de cache falhou; avaliação já foi apagada */
    }
    if (materiaId && conteudoId) {
      router.push(`/avaliacoes/${materiaId}/${conteudoId}`)
    }
  }

  const reabrirAvaliacao = async () => {
    if (!avaliacaoId || avaliacaoId === "nova") return
    try {
      await avaliacoesRequests.reabrir(avaliacaoId, {
        prazo_utc: dataEntrega?.toISOString(),
      })
      if (materiaId) await invalidarArvore(materiaId)
      await qc.invalidateQueries({ queryKey: queryKeys.avaliacoes.detalhe(avaliacaoId) })
      setModalReabrirAberto(false)
      toast.success("Avaliação reaberta")
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao reabrir")
    }
  }

  const dialogoConfirmacao = (
    <Dialog open={!!confirmacao} onOpenChange={(aberto) => !aberto && setConfirmacao(null)}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{confirmacao?.titulo}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{confirmacao?.descricao}</p>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setConfirmacao(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={() => {
              const acao = confirmacao?.acao
              setConfirmacao(null)
              if (acao) void acao()
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const adicionarQuestao = () => {
    if (!modoEdicao) return
    setQuestoes((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
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
              const titulo = nomeNovaPasta.trim() || "Nova pasta de avaliações"
              const pendKey = `pasta-${Date.now()}`
              setPendentesLocais((p) => [
                ...p,
                { key: pendKey, titulo, tipo: "pasta" },
              ])
              setPendenciaNovaPasta(null)
              setNomeNovaPasta("")
              void adicionarConteudoNoAssunto(mid, aid, titulo)
                .then((novoId) => {
                  setPendentesLocais((p) => p.filter((x) => x.key !== pendKey))
                  if (novoId) router.push(`/avaliacoes/${mid}/${novoId}`)
                })
                .catch(() => {
                  setPendentesLocais((p) => p.filter((x) => x.key !== pendKey))
                  toast.error("Não foi possível criar a pasta")
                })
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
        {todosPendentes
          .filter((p) => p.tipo === "materia")
          .map((p) => (
            <CardPendente key={p.key} className="min-h-[120px]" linhas={2} />
          ))}
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
                  const primeiroAssunto = materia.assuntos.find((a) => a.id !== "_loading")
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
                {todosPendentes
                  .filter((p) => p.tipo === "pasta" || p.tipo === "assunto")
                  .map((p) => (
                    <CardPendente key={p.key} linhas={2} />
                  ))}
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
              onClick={() => void criarNovaAvaliacao()}
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
                      {(avaliacao.alunosFeitos != null || avaliacao.alunosTotal != null) && (
                        <p className="text-xs text-muted-foreground">
                          {avaliacao.alunosFeitos ?? 0}
                          {avaliacao.alunosTotal != null ? ` de ${avaliacao.alunosTotal}` : ""} submissões
                        </p>
                      )}
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      {badgeStatus(avaliacao.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => void duplicarAvaliacao(avaliacao.id)}
                      >
                        <CopyPlus className="mr-1 h-3.5 w-3.5" />
                        Duplicar
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => copiarLink(url)}>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Link
                      </Button>
                      {avaliacao.status === "rascunho" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-destructive"
                          onClick={() =>
                            setConfirmacao({
                              titulo: "Apagar avaliação?",
                              descricao: "Esta ação é permanente e não pode ser desfeita.",
                              acao: () => apagarAvaliacao(avaliacao.id),
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(avaliacao.status === "publicada" || avaliacao.status === "encerrada") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg"
                          onClick={() =>
                            setConfirmacao({
                              titulo: "Inativar avaliação?",
                              descricao: "A prova será cancelada e deixará de aparecer para os alunos.",
                              acao: () => inativarAvaliacao(avaliacao.id),
                            })
                          }
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Inativar
                        </Button>
                      )}
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
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-xl text-xs sm:text-sm"
            disabled={!modoEdicao}
            onClick={() => void salvarRascunho()}
          >
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
          <Button
            className="h-10 gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-xs shadow-soft sm:text-sm"
            disabled={!modoEdicao}
            onClick={abrirModalPublicar}
          >
            <CheckCircle2 className="h-4 w-4" />
            Publicar
          </Button>
          {!modoEdicao && avaliacaoId && avaliacaoId !== "nova" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl"
                onClick={() => void duplicarAvaliacao(avaliacaoId)}
              >
                <CopyPlus className="mr-1 h-4 w-4" />
                Duplicar
              </Button>
              {detalheApi?.status === "publicada" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl"
                  onClick={() =>
                    setConfirmacao({
                      titulo: "Encerrar avaliação?",
                      descricao: "Alunos não poderão mais enviar respostas.",
                      acao: () => encerrarAvaliacao(avaliacaoId),
                    })
                  }
                >
                  Encerrar
                </Button>
              )}
              {(detalheApi?.status === "publicada" || detalheApi?.status === "encerrada") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl"
                  onClick={() =>
                    setConfirmacao({
                      titulo: "Inativar avaliação?",
                      descricao: "A prova será cancelada e ocultada dos alunos.",
                      acao: () => inativarAvaliacao(avaliacaoId),
                    })
                  }
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Inativar
                </Button>
              )}
              {(detalheApi?.status === "encerrada" || detalheApi?.status === "inativa") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl"
                  onClick={() => setModalReabrirAberto(true)}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Reabrir
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl text-destructive"
                onClick={() =>
                  setConfirmacao({
                    titulo: "Apagar avaliação permanentemente?",
                    descricao: "Todos os dados, questões e submissões serão removidos do banco.",
                    acao: () => apagarAvaliacao(avaliacaoId),
                  })
                }
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Apagar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
                      ? "Edite as questões abaixo e publique quando estiver pronto."
                      : "Visualização da avaliação publicada ou encerrada."}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit shrink-0 rounded-full px-4 py-1.5 text-sm">
                  {questoes.length} {questoes.length === 1 ? "questão" : "questões"}
                </Badge>
              </div>

              {!modoEdicao && avaliacaoId && avaliacaoId !== "nova" && (
                <div className="mb-6">
                  <PainelSubmissoesAvaliacao avaliacaoId={avaliacaoId} />
                </div>
              )}

              {questoes.length === 0 && modoEdicao && (
                <Card className="rounded-2xl border-dashed border-border/60 bg-secondary/20">
                  <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                    <FileQuestion className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Comece adicionando questões manualmente.
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
      </div>

      <Dialog open={modalPublicarAberto} onOpenChange={setModalPublicarAberto}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar para qual turma?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Turma</Label>
            <Select value={turmaPublicarId} onValueChange={setTurmaPublicarId}>
              <SelectTrigger className="rounded-xl">
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
            <p className="text-xs text-muted-foreground">
              Somente alunos matriculados nesta turma verão a prova.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModalPublicarAberto(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={() => void publicarAvaliacao()}>
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalReabrirAberto} onOpenChange={setModalReabrirAberto}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reabrir avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Novo prazo (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dataEntrega ? format(dataEntrega, "PPP", { locale: ptBR }) : "Manter prazo atual"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl p-0" align="start">
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
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModalReabrirAberto(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={() => void reabrirAvaliacao()}>
              Reabrir prova
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialogoConfirmacao}
    </div>
  )
}
