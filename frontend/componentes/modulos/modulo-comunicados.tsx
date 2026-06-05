"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { comunicadosRequests } from "@/lib/api/requests/comunicados"
import { leituraRequests, cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import type { ComunicadoListItem, ComunicadoDetail } from "@/lib/api/dtos/comunicados"
import {
  ArrowLeft,
  Check,
  ChevronsRight,
  Clock,
  GraduationCap,
  ImagePlus,
  Inbox,
  MailCheck,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  ModalCriarComunicadoWizard,
  ModalEditarComunicadoWizard,
} from "@/componentes/modulos/wizards/modal-comunicado-wizard"
import { cn } from "@/lib/utils"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import type { TipoDestinatarioComunicado } from "@/lib/api/dtos/common"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface Destinatario {
  id: string
  tipo: TipoDestinatarioComunicado
  nome: string
}

interface Comunicado {
  id: string
  titulo: string
  conteudo: string
  destinatarios: Destinatario[]
  dataHora: string
  lido: boolean
  status: "rascunho" | "publicado"
  imagens: string[]
  total_destinatarios?: number | null
  total_lidos?: number | null
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString("pt-BR")
  } catch {
    return iso
  }
}

function listaParaComunicado(item: ComunicadoListItem): Comunicado {
  return {
    id: item.id,
    titulo: item.titulo,
    conteudo: item.preview_corpo ?? "",
    destinatarios: [],
    dataHora: formatarData(item.publicado_em),
    lido: item.lido,
    status: item.status,
    imagens: [],
  }
}

function detalheParaComunicado(
  d: ComunicadoDetail,
  catalogo: Map<string, Destinatario>
): Comunicado {
  return {
    id: d.id,
    titulo: d.titulo,
    conteudo: d.corpo,
    destinatarios: d.destinatarios.map((x) => {
      const chave = `${x.tipo}:${x.id}`
      const encontrado = catalogo.get(chave)
      return (
        encontrado ?? {
          id: x.id,
          tipo: x.tipo,
          nome: x.id,
        }
      )
    }),
    dataHora: formatarData(d.publicado_em),
    lido: d.lido,
    status: d.status,
    imagens: d.imagens_urls,
    total_destinatarios: d.total_destinatarios,
    total_lidos: d.total_lidos,
  }
}

function badgeTipo(tipo: Destinatario["tipo"]) {
  if (tipo === "aluno") {
    return (
      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
        <UserRound className="mr-1 h-2.5 w-2.5" />
        Aluno
      </Badge>
    )
  }

  if (tipo === "turma") {
    return (
      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
        <GraduationCap className="mr-1 h-2.5 w-2.5" />
        Turma
      </Badge>
    )
  }

  if (tipo === "professor") {
    return (
      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
        <ShieldCheck className="mr-1 h-2.5 w-2.5" />
        Professor
      </Badge>
    )
  }

  if (tipo === "responsavel") {
    return (
      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
        <Users className="mr-1 h-2.5 w-2.5" />
        Responsavel
      </Badge>
    )
  }

  return null
}

function rotuloStatus(status: Comunicado["status"]) {
  return status === "rascunho" ? "Rascunho" : "Publicado"
}

const LISTA_VAZIA: ComunicadoListItem[] = []

function PainelLeiturasComunicado({ comunicadoId }: { comunicadoId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.comunicados.leituras(comunicadoId),
    queryFn: () => comunicadosRequests.leituras(comunicadoId),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando leituras...</p>
  }
  if (!data?.itens.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum destinatario efetivo ou comunicado ainda nao publicado.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Quem visualizou</p>
        <Badge variant="secondary" className="rounded-full">
          {data.total_lidos}/{data.total_destinatarios} lidos
        </Badge>
      </div>
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {data.itens.map((item) => (
          <li
            key={item.usuario_id}
            className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-sm"
          >
            <span className="truncate font-medium">{item.nome_exibicao}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {item.lido ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  {item.lido_em
                    ? new Date(item.lido_em).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Lido"}
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Nao lido
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ModuloComunicados({ somenteLeitura = false }: { somenteLeitura?: boolean }) {
  const { usuario } = useAuth()
  const ehStaff =
    usuario?.perfil === "professor" || usuario?.perfil === "administrador"
  const qc = useQueryClient()
  const [dialogAberto, setDialogAberto] = React.useState(false)
  const [editarAberto, setEditarAberto] = React.useState(false)
  const [comunicadoSelecionado, setComunicadoSelecionado] = React.useState<Comunicado | null>(null)
  const precisaCatalogo =
    !somenteLeitura && (dialogAberto || editarAberto || comunicadoSelecionado !== null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.comunicados.lista(),
    queryFn: () => comunicadosRequests.list(),
  })
  const listaApi = data ?? LISTA_VAZIA

  const { data: turmas = [] } = useQuery({
    queryKey: queryKeys.turmas.resumo(),
    queryFn: () => leituraRequests.listTurmas(),
    enabled: precisaCatalogo,
  })
  const { data: alunos = [] } = useQuery({
    queryKey: queryKeys.cadastros.alunos(),
    queryFn: () => cadastrosRequests.listAlunos(),
    enabled: precisaCatalogo,
  })
  const { data: responsaveis = [] } = useQuery({
    queryKey: queryKeys.cadastros.responsaveis(),
    queryFn: () => cadastrosRequests.listResponsaveis(),
    enabled: precisaCatalogo && ehStaff,
  })
  const { data: professores = [] } = useQuery({
    queryKey: queryKeys.cadastros.professores(),
    queryFn: () => cadastrosRequests.listProfessores(),
    enabled: precisaCatalogo && ehStaff,
  })

  const catalogoMap = React.useMemo(() => {
    const map = new Map<string, Destinatario>()
    turmas.forEach((t) => map.set(`turma:${t.id}`, { id: t.id, tipo: "turma", nome: t.nome }))
    alunos.forEach((a) =>
      map.set(`aluno:${a.id}`, { id: a.id, tipo: "aluno", nome: a.nome_exibicao })
    )
    responsaveis.forEach((r) =>
      map.set(`responsavel:${r.id}`, { id: r.id, tipo: "responsavel", nome: r.nome_exibicao })
    )
    professores.forEach((p) =>
      map.set(`professor:${p.id}`, { id: p.id, tipo: "professor", nome: p.nome_exibicao })
    )
    return map
  }, [turmas, alunos, responsaveis, professores])

  const comunicadosBase = React.useMemo(
    () => listaApi.map(listaParaComunicado),
    [listaApi]
  )
  const [lidosLocal, setLidosLocal] = React.useState<Record<string, boolean>>({})
  const comunicados = React.useMemo(
    () =>
      comunicadosBase.map((c) =>
        lidosLocal[c.id] !== undefined ? { ...c, lido: lidosLocal[c.id] } : c
      ),
    [comunicadosBase, lidosLocal]
  )
  const selecionarComunicado = async (comunicado: Comunicado) => {
    try {
      const detalhe = await comunicadosRequests.get(comunicado.id)
      const completo = detalheParaComunicado(detalhe, catalogoMap)
      setComunicadoSelecionado(completo)
      if (!completo.lido) {
        await comunicadosRequests.marcarLido(completo.id)
        setLidosLocal((prev) => ({ ...prev, [completo.id]: true }))
        void qc.invalidateQueries({ queryKey: queryKeys.comunicados.lista() })
      }
      if (ehStaff && completo.status === "publicado") {
        void qc.invalidateQueries({ queryKey: queryKeys.comunicados.leituras(completo.id) })
      }
    } catch {
      toast.error("Não foi possível abrir este comunicado.")
    }
  }

  const naoLidos = comunicados.filter((c) => !c.lido).length

  const marcarTodosLidos = async () => {
    await comunicadosRequests.marcarTodosLidos()
    setLidosLocal(
      Object.fromEntries(comunicados.map((c) => [c.id, true]))
    )
    void qc.invalidateQueries({ queryKey: queryKeys.comunicados.lista() })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Carregando comunicados...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">Não foi possível carregar os comunicados.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-[calc(100vh-5rem)]">
      <ModalCriarComunicadoWizard aberto={dialogAberto} onOpenChange={setDialogAberto} />
      {comunicadoSelecionado && (
        <ModalEditarComunicadoWizard
          comunicadoId={comunicadoSelecionado.id}
          tituloInicial={comunicadoSelecionado.titulo}
          corpoInicial={comunicadoSelecionado.conteudo}
          aberto={editarAberto}
          onOpenChange={setEditarAberto}
        />
      )}

      <div className="flex h-full flex-col lg:hidden">
        {!comunicadoSelecionado ? (
          <div className="flex h-full flex-col rounded-none border-border/50 bg-card/60 backdrop-blur-xl">
            <div className="border-b border-border/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    Comunicados
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{naoLidos > 0 ? `${naoLidos} nao lidos` : "Todos lidos"}</p>
                </div>
                <div className="flex gap-2">
                  {naoLidos > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-xl"
                      onClick={() => void marcarTodosLidos()}
                    >
                      Marcar todos lidos
                    </Button>
                  )}
                  {!somenteLeitura && (
                    <Button size="sm" className="h-10 gap-2 rounded-xl" onClick={() => setDialogAberto(true)}>
                      <Plus className="h-4 w-4" />
                      Novo
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {comunicados.map((comunicado) => (
                  <button
                    key={comunicado.id}
                    onClick={() => void selecionarComunicado(comunicado)}
                    className={cn(
                      "mb-1 w-full rounded-xl border p-4 text-left transition-all",
                      "border-transparent hover:bg-secondary/80",
                      !comunicado.lido && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!comunicado.lido ? (
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className={cn("truncate text-sm", !comunicado.lido && "font-semibold")}>{comunicado.titulo}</p>
                          <Badge variant={comunicado.status === "rascunho" ? "outline" : "secondary"} className="rounded-full text-[10px]">
                            {rotuloStatus(comunicado.status)}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {comunicado.conteudo.split("\n")[0]}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          {comunicado.dataHora}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex h-full flex-col bg-background">
            <div className="flex items-center gap-2 border-b border-border/50 p-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setComunicadoSelecionado(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="truncate font-medium">{comunicadoSelecionado.titulo}</p>
                <p className="text-xs text-muted-foreground">{rotuloStatus(comunicadoSelecionado.status)}</p>
              </div>
            </div>
            <ScrollArea className="flex-1 p-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {comunicadoSelecionado.destinatarios.map((destinatario) => (
                    <Badge key={destinatario.id} variant="secondary" className="rounded-full px-3 py-1 font-medium">
                      {destinatario.nome}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-3">
                  {comunicadoSelecionado.conteudo.split("\n").map((linha, index) => (
                    <p key={`${linha}-${index}`} className={cn("text-sm leading-relaxed", !linha && "h-3")}>
                      {linha}
                    </p>
                  ))}
                </div>
                {comunicadoSelecionado.imagens.length > 0 && (
                  <div className="grid grid-cols-1 gap-3">
                    {comunicadoSelecionado.imagens.map((imagem, index) => (
                      <img key={`${imagem.slice(0, 20)}-${index}`} src={imagem} alt={`Imagem anexada ${index + 1}`} className="w-full rounded-xl border border-border/60" />
                    ))}
                  </div>
                )}
                {ehStaff && comunicadoSelecionado.status === "publicado" && (
                  <PainelLeiturasComunicado comunicadoId={comunicadoSelecionado.id} />
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="hidden h-full lg:flex">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            comunicadoSelecionado ? "w-[420px] border-r border-border/50" : "flex w-full items-center justify-center px-8"
          )}
        >
          <div
            className={cn(
              "flex h-full w-full flex-col bg-card/60 backdrop-blur-xl transition-all duration-500 ease-out",
              comunicadoSelecionado ? "rounded-none" : "my-6 max-w-3xl overflow-hidden rounded-3xl border border-border/60 shadow-soft-lg"
            )}
          >
            <div className="border-b border-border/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    Comunicados
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{naoLidos > 0 ? `${naoLidos} nao lidos` : "Todos lidos"}</p>
                </div>
                <div className="flex gap-2">
                  {naoLidos > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-xl"
                      onClick={() => void marcarTodosLidos()}
                    >
                      Marcar todos lidos
                    </Button>
                  )}
                  {!somenteLeitura && (
                    <Button size="sm" className="h-10 gap-2 rounded-xl" onClick={() => setDialogAberto(true)}>
                      <Plus className="h-4 w-4" />
                      Novo
                    </Button>
                  )}
                </div>
              </div>
              {!comunicadoSelecionado && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                  <ChevronsRight className="h-3.5 w-3.5 text-primary" />
                  Selecione um comunicado para abrir o painel de leitura.
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {comunicados.map((comunicado) => (
                  <button
                    key={comunicado.id}
                    onClick={() => void selecionarComunicado(comunicado)}
                    className={cn(
                      "mb-1 w-full rounded-xl border p-4 text-left transition-all",
                      comunicadoSelecionado?.id === comunicado.id ? "border-primary/40 bg-primary/10" : "border-transparent hover:bg-secondary/80",
                      !comunicado.lido && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!comunicado.lido ? (
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className={cn("truncate text-sm", !comunicado.lido && "font-semibold")}>{comunicado.titulo}</p>
                          <Badge variant={comunicado.status === "rascunho" ? "outline" : "secondary"} className="rounded-full text-[10px]">
                            {rotuloStatus(comunicado.status)}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {comunicado.conteudo.split("\n")[0]}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                            <Clock className="h-3 w-3" />
                            {comunicado.dataHora}
                          </span>
                          <div className="flex flex-wrap items-center gap-1">
                            {comunicado.destinatarios.slice(0, 2).map((destinatario) => (
                              <Badge key={`${comunicado.id}-${destinatario.id}`} variant="outline" className="rounded-full text-[10px]">
                                {destinatario.tipo === "turma" ? <ShieldCheck className="mr-1 h-2.5 w-2.5" /> : <Tag className="mr-1 h-2.5 w-2.5" />}
                                {destinatario.nome}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div
          className={cn(
            "flex-1 bg-background transition-all duration-500 ease-out",
            comunicadoSelecionado ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"
          )}
        >
          {comunicadoSelecionado ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border/50 p-8">
                <div className="max-w-3xl">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {comunicadoSelecionado.destinatarios.map((destinatario) => (
                      <Badge key={destinatario.id} variant="secondary" className="rounded-full px-3 py-1 font-medium">
                        {destinatario.nome}
                      </Badge>
                    ))}
                    <Badge variant={comunicadoSelecionado.status === "rascunho" ? "outline" : "default"} className="rounded-full">
                      {rotuloStatus(comunicadoSelecionado.status)}
                    </Badge>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                      {comunicadoSelecionado.titulo}
                    </h2>
                    {!somenteLeitura && comunicadoSelecionado.status === "rascunho" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1 shrink-0"
                        onClick={() => setEditarAberto(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    )}
                  </div>
                  {comunicadoSelecionado.dataHora && (
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {comunicadoSelecionado.dataHora}
                      </span>
                      {comunicadoSelecionado.total_destinatarios != null && (
                        <span>
                          Leituras: {comunicadoSelecionado.total_lidos ?? 0}/
                          {comunicadoSelecionado.total_destinatarios}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="mx-auto max-w-3xl space-y-6">
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                    {comunicadoSelecionado.conteudo.split("\n").map((linha, index) => (
                      <p key={`${linha}-${index}`} className={cn(!linha && "h-3")}>
                        {linha}
                      </p>
                    ))}
                  </div>
                  {comunicadoSelecionado.imagens.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {comunicadoSelecionado.imagens.map((imagem, index) => (
                        <img
                          key={`${imagem.slice(0, 20)}-${index}`}
                          src={imagem}
                          alt={`Imagem anexada ${index + 1}`}
                          className="h-48 w-full rounded-xl border border-border/70 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {ehStaff && comunicadoSelecionado.status === "publicado" && (
                    <PainelLeiturasComunicado comunicadoId={comunicadoSelecionado.id} />
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-muted-foreground">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/50">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium">Selecione um comunicado</p>
              <p className="mt-1 text-sm">A lista permanece centralizada ate voce abrir um comunicado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
