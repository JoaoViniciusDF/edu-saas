"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bot, ChevronDown, FolderOpen, Paperclip, Send, Sparkles, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import { conteudoRequests } from "@/lib/api/requests/conteudo"
import { queryKeys } from "@/lib/cache/query-keys"
import type { IaQuestaoGerada } from "@/lib/api/dtos/avaliacoes"

type Papel = "usuario" | "assistente"
type Mensagem = { papel: Papel; conteudo: string }
export type RefConteudo = { kind: "pasta" | "material"; id: string; nome: string }
type Referencia = RefConteudo

export type CorpoIa = { mensagem: string; material_ids: string[]; pasta_ids: string[] }

// Chave usada no sessionStorage para repassar o 1º pedido da página da matéria
// para o editor (onde a prova é montada ao vivo).
export const IA_PENDENTE_KEY = "ia-pendente-nova"

export function ChatIaProva({
  avaliacaoId,
  garantirAvaliacaoId,
  onQuestao,
  onFechar,
  onLancar,
}: {
  avaliacaoId: string | null
  garantirAvaliacaoId?: () => Promise<string | null>
  onQuestao: (q: IaQuestaoGerada) => void
  onFechar: () => void
  /** Modo "lançar": em vez de transmitir aqui, delega (ex.: criar rascunho e
   * navegar ao editor). Usado na página da matéria. */
  onLancar?: (corpo: CorpoIa, refs: RefConteudo[]) => Promise<void>
}) {
  const [mensagens, setMensagens] = React.useState<Mensagem[]>([])
  const [entrada, setEntrada] = React.useState("")
  const [refs, setRefs] = React.useState<Referencia[]>([])
  const [enviando, setEnviando] = React.useState(false)
  const [pickerAberto, setPickerAberto] = React.useState(false)
  const [pastaExpandida, setPastaExpandida] = React.useState<string | null>(null)
  const fimRef = React.useRef<HTMLDivElement>(null)
  const autoIniciouRef = React.useRef(false)

  const idValido = !!avaliacaoId && avaliacaoId !== "nova"

  // Histórico (apenas no modo editor, não no modo lançar)
  const { data: historico } = useQuery({
    queryKey: ["avaliacoes", "chat-ia", avaliacaoId],
    queryFn: () => avaliacoesRequests.chatIaHistorico(avaliacaoId as string),
    enabled: idValido && !onLancar,
  })
  React.useEffect(() => {
    if (historico) {
      setMensagens(historico.map((m) => ({ papel: m.papel, conteudo: m.conteudo })))
    }
  }, [historico])

  React.useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  // Auto-início: pedido repassado pela página da matéria via sessionStorage.
  React.useEffect(() => {
    if (onLancar || autoIniciouRef.current || typeof window === "undefined") return
    const raw = window.sessionStorage.getItem(IA_PENDENTE_KEY)
    if (!raw) return
    window.sessionStorage.removeItem(IA_PENDENTE_KEY)
    autoIniciouRef.current = true
    try {
      const p = JSON.parse(raw) as { mensagem: string; refs?: Referencia[] }
      const refsIniciais = p.refs ?? []
      setRefs(refsIniciais)
      setEntrada(p.mensagem)
      void enviar(p.mensagem, refsIniciais)
    } catch {
      /* stash inválido: ignora */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Picker de conteúdo (@)
  const { data: pastas = [] } = useQuery({
    queryKey: queryKeys.conteudo.pastas(null, null),
    queryFn: () => conteudoRequests.listPastas(),
    enabled: pickerAberto,
  })
  const { data: materiais = [] } = useQuery({
    queryKey: queryKeys.conteudo.materiais(pastaExpandida ?? "", null),
    queryFn: () => conteudoRequests.listMateriais(pastaExpandida as string),
    enabled: pickerAberto && !!pastaExpandida,
  })

  const adicionarRef = (ref: Referencia) => {
    setRefs((prev) => (prev.some((r) => r.kind === ref.kind && r.id === ref.id) ? prev : [...prev, ref]))
    setEntrada((t) => (t.endsWith("@") ? t.slice(0, -1) : t))
    setPickerAberto(false)
  }
  const removerRef = (ref: Referencia) =>
    setRefs((prev) => prev.filter((r) => !(r.kind === ref.kind && r.id === ref.id)))

  const enviar = async (textoArg?: string, refsArg?: Referencia[]) => {
    const texto = (textoArg ?? entrada).trim()
    const usados = refsArg ?? refs
    if (!texto || enviando) return
    const corpo: CorpoIa = {
      mensagem: texto,
      material_ids: usados.filter((r) => r.kind === "material").map((r) => r.id),
      pasta_ids: usados.filter((r) => r.kind === "pasta").map((r) => r.id),
    }

    // Modo lançar (página da matéria): delega e sai.
    if (onLancar) {
      setEnviando(true)
      try {
        await onLancar(corpo, usados)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível iniciar a prova.")
      } finally {
        setEnviando(false)
      }
      return
    }

    const id = idValido ? (avaliacaoId as string) : garantirAvaliacaoId ? await garantirAvaliacaoId() : null
    if (!id) {
      toast.error("Não foi possível iniciar a avaliação para a IA.")
      return
    }
    setMensagens((m) => [...m, { papel: "usuario", conteudo: texto }, { papel: "assistente", conteudo: "" }])
    setEntrada("")
    setEnviando(true)
    try {
      const res = await fetch(`/api/bff-stream/avaliacoes/gerar-ia/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      })
      if (!res.ok || !res.body) {
        throw new Error("Falha ao conectar à IA.")
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const blocos = buf.split("\n\n")
        buf = blocos.pop() ?? ""
        for (const bloco of blocos) {
          const linha = bloco.split("\n").find((l) => l.startsWith("data:"))
          if (!linha) continue
          let ev: { type: string; delta?: string; questao?: IaQuestaoGerada; mensagem?: string }
          try {
            ev = JSON.parse(linha.slice(5).trim())
          } catch {
            continue
          }
          if (ev.type === "mensagem" && ev.delta) {
            setMensagens((m) => {
              const c = [...m]
              const ult = c[c.length - 1]
              if (ult?.papel === "assistente") c[c.length - 1] = { ...ult, conteudo: ult.conteudo + ev.delta }
              return c
            })
          } else if (ev.type === "questao" && ev.questao) {
            onQuestao(ev.questao)
          } else if (ev.type === "aviso" && ev.mensagem) {
            toast.message(ev.mensagem)
          } else if (ev.type === "erro" && ev.mensagem) {
            toast.error(ev.mensagem)
          }
        }
      }
      setRefs([])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar com a IA.")
      setMensagens((m) => {
        const c = [...m]
        const ult = c[c.length - 1]
        if (ult?.papel === "assistente" && !ult.conteudo) c.pop()
        return c
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex w-full shrink-0 flex-col border-t border-border/60 bg-card/60 lg:h-auto lg:w-[380px] lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold">Criar com IA</p>
            <p className="text-xs text-muted-foreground">As questões aparecem ao lado em tempo real</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onFechar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-[240px] flex-1">
        <div className="space-y-4 p-4">
          {mensagens.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              Descreva a prova que você quer. Use <span className="font-mono font-semibold">@</span> para anexar
              conteúdos. Ex.: <em>“crie 5 questões de múltipla escolha sobre frações com base em @Matemática”</em>.
            </div>
          )}
          {mensagens.map((m, i) => (
            <div key={i} className={m.papel === "usuario" ? "flex justify-end" : "flex gap-2"}>
              {m.papel === "assistente" && (
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </span>
              )}
              <div
                className={
                  m.papel === "usuario"
                    ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm"
                }
              >
                {m.conteudo || (m.papel === "assistente" && enviando ? "Pensando…" : "")}
                {m.papel === "usuario" && (
                  <User className="ml-1 inline h-3 w-3 opacity-60" aria-hidden />
                )}
              </div>
            </div>
          ))}
          <div ref={fimRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-3">
        {refs.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {refs.map((r) => (
              <Badge key={`${r.kind}-${r.id}`} variant="secondary" className="gap-1 rounded-full">
                {r.kind === "pasta" ? <FolderOpen className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                {r.nome}
                <button type="button" onClick={() => removerRef(r)} className="ml-0.5 opacity-70 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <Popover open={pickerAberto} onOpenChange={setPickerAberto}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" title="Anexar conteúdo (@)">
                <Paperclip className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 rounded-2xl p-0">
              <div className="border-b border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                Anexar conteúdo como referência
              </div>
              <ScrollArea className="max-h-72">
                <div className="p-1">
                  {pastas.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma pasta encontrada.</p>
                  )}
                  {pastas.map((p) => (
                    <div key={p.id}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                          onClick={() => adicionarRef({ kind: "pasta", id: p.id, nome: p.nome_disciplina })}
                        >
                          <FolderOpen className="h-4 w-4 text-primary" />
                          <span className="truncate">{p.nome_disciplina}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => setPastaExpandida((cur) => (cur === p.id ? null : p.id))}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${pastaExpandida === p.id ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </div>
                      {pastaExpandida === p.id && (
                        <div className="ml-4 border-l border-border/50 pl-2">
                          {materiais.length === 0 && (
                            <p className="px-2 py-1.5 text-xs text-muted-foreground">Sem materiais.</p>
                          )}
                          {materiais.map((mat) => (
                            <button
                              key={mat.id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                              onClick={() => adicionarRef({ kind: "material", id: mat.id, nome: mat.titulo })}
                            >
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="truncate">{mat.titulo}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Textarea
            value={entrada}
            onChange={(e) => {
              const v = e.target.value
              setEntrada(v)
              if (v.endsWith("@")) setPickerAberto(true)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void enviar()
              }
            }}
            placeholder="Peça à IA para criar a prova… (use @ para anexar conteúdo)"
            className="min-h-[44px] flex-1 resize-none rounded-xl"
            rows={1}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            disabled={enviando || !entrada.trim()}
            onClick={() => void enviar()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
