"use client"

import * as React from "react"
import {
  ArrowLeft,
  Check,
  ChevronsRight,
  Clock,
  GraduationCap,
  ImagePlus,
  Inbox,
  MailCheck,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Destinatario {
  id: string
  tipo: "aluno" | "turma" | "responsavel"
  nome: string
}

interface Comunicado {
  id: string
  titulo: string
  conteudo: string
  destinatarios: Destinatario[]
  dataHora: string
  lido: boolean
  autor: string
  status: "rascunho" | "publicado"
  imagens: string[]
}

const turmasMock: Destinatario[] = [
  { id: "turma-8a", tipo: "turma", nome: "Turma 8A" },
  { id: "turma-8b", tipo: "turma", nome: "Turma 8B" },
  { id: "turma-9a", tipo: "turma", nome: "Turma 9A" },
]

const alunosMock: Destinatario[] = [
  { id: "aluno-ana", tipo: "aluno", nome: "Ana Souza" },
  { id: "aluno-joao", tipo: "aluno", nome: "Joao Lima" },
  { id: "aluno-camila", tipo: "aluno", nome: "Camila Rocha" },
  { id: "aluno-pedro", tipo: "aluno", nome: "Pedro Costa" },
]

const responsaveisMock: Destinatario[] = [
  { id: "resp-maria", tipo: "responsavel", nome: "Maria Souza (resp. Ana)" },
  { id: "resp-paulo", tipo: "responsavel", nome: "Paulo Lima (resp. Joao)" },
  { id: "resp-lucia", tipo: "responsavel", nome: "Lucia Rocha (resp. Camila)" },
]

const comunicadosIniciais: Comunicado[] = [
  {
    id: "1",
    titulo: "Reuniao de pais - 2o bimestre",
    conteudo: `Prezados pais e responsaveis,

Convidamos todos para a reuniao de pais referente ao 2o bimestre letivo, que ocorrera no dia 20 de abril de 2026, as 19h, no auditorio da escola.

Pautas:
- Apresentacao do desempenho academico
- Calendario de avaliacoes
- Projetos interdisciplinares
- Informes gerais

Contamos com a presenca de todos!

Atenciosamente,
Coordenacao pedagogica`,
    destinatarios: [responsaveisMock[0], turmasMock[0]],
    dataHora: "Hoje, 10:30",
    lido: false,
    autor: "Coord. Pedagogica",
    status: "publicado",
    imagens: [],
  },
  {
    id: "2",
    titulo: "Entrega de trabalho de Ciencias",
    conteudo: `Caros alunos,

Lembramos que o prazo para entrega do trabalho sobre Ecossistemas Brasileiros e dia 18/04.

Requisitos:
- Minimo de 5 paginas
- Incluir imagens e graficos
- Capa padronizada
- Entregar em formato PDF

Duvidas podem ser enviadas pelo chat da plataforma.

Prof. Carlos Mendes`,
    destinatarios: [alunosMock[1], alunosMock[3]],
    dataHora: "Ontem, 14:15",
    lido: true,
    autor: "Prof. Carlos",
    status: "publicado",
    imagens: [],
  },
  {
    id: "3",
    titulo: "Atualizacao do calendario escolar",
    conteudo: `Informamos a todos que houve alteracoes no calendario escolar:

- 21/04 - Feriado de Tiradentes (nao havera aula)
- 22/04 - Recesso escolar
- 23/04 - Retorno normal das atividades

Aproveitem para descansar e revisar os conteudos!

Secretaria escolar`,
    destinatarios: [turmasMock[1], responsaveisMock[1], responsaveisMock[2]],
    dataHora: "15/04/2026",
    lido: true,
    autor: "Secretaria",
    status: "publicado",
    imagens: [],
  },
  {
    id: "4",
    titulo: "Olimpiada de Matematica - inscricoes",
    conteudo: `As inscricoes para a Olimpiada Brasileira de Matematica estao abertas!

Interessados devem procurar o professor de matematica ate o dia 25/04.

Premiacao:
- 1o lugar: Medalha de ouro + bolsa de estudos
- 2o lugar: Medalha de prata
- 3o lugar: Medalha de bronze

Boa sorte a todos os participantes!`,
    destinatarios: [alunosMock[0], alunosMock[2], turmasMock[2]],
    dataHora: "14/04/2026",
    lido: false,
    autor: "Prof. Ana",
    status: "publicado",
    imagens: [],
  },
]

const catalogoDestinatarios = [...turmasMock, ...alunosMock, ...responsaveisMock]

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

  return (
    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium">
      <Users className="mr-1 h-2.5 w-2.5" />
      Responsavel
    </Badge>
  )
}

function rotuloStatus(status: Comunicado["status"]) {
  return status === "rascunho" ? "Rascunho" : "Publicado"
}

export function ModuloComunicados() {
  const [comunicados, setComunicados] = React.useState<Comunicado[]>(comunicadosIniciais)
  const [comunicadoSelecionado, setComunicadoSelecionado] = React.useState<Comunicado | null>(null)
  const [dialogAberto, setDialogAberto] = React.useState(false)
  const [buscaDestinatario, setBuscaDestinatario] = React.useState("")
  const [imagensTemporarias, setImagensTemporarias] = React.useState<string[]>([])
  const [novoComunicado, setNovoComunicado] = React.useState({
    titulo: "",
    conteudo: "",
    destinatarios: [] as Destinatario[],
  })

  const selecionarComunicado = (comunicado: Comunicado) => {
    setComunicadoSelecionado(comunicado)
    if (!comunicado.lido) {
      setComunicados((prev) =>
        prev.map((item) => (item.id === comunicado.id ? { ...item, lido: true } : item))
      )
    }
  }

  const resetFormulario = () => {
    setNovoComunicado({ titulo: "", conteudo: "", destinatarios: [] })
    setImagensTemporarias([])
    setBuscaDestinatario("")
  }

  const criarComunicado = (status: Comunicado["status"]) => {
    const possuiConteudo = Boolean(novoComunicado.conteudo.trim()) || imagensTemporarias.length > 0
    if (!novoComunicado.titulo.trim() || !possuiConteudo || novoComunicado.destinatarios.length === 0) return

    const novo: Comunicado = {
      id: Date.now().toString(),
      titulo: novoComunicado.titulo,
      conteudo: novoComunicado.conteudo,
      destinatarios: novoComunicado.destinatarios,
      dataHora: "Agora",
      lido: status === "rascunho",
      autor: "Prof. Maria",
      status,
      imagens: imagensTemporarias,
    }

    setComunicados((prev) => [novo, ...prev])
    setComunicadoSelecionado(novo)
    resetFormulario()
    setDialogAberto(false)
  }

  const adicionarDestinatario = (destinatario: Destinatario) => {
    setNovoComunicado((prev) => {
      if (prev.destinatarios.some((item) => item.id === destinatario.id)) return prev
      return { ...prev, destinatarios: [...prev.destinatarios, destinatario] }
    })
    setBuscaDestinatario("")
  }

  const removerDestinatario = (destinatarioId: string) => {
    setNovoComunicado((prev) => ({
      ...prev,
      destinatarios: prev.destinatarios.filter((item) => item.id !== destinatarioId),
    }))
  }

  const processarImagemClipboard = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const arquivosImagem = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((arquivo): arquivo is File => Boolean(arquivo))

    if (arquivosImagem.length === 0) return
    event.preventDefault()

    arquivosImagem.forEach((arquivo) => {
      const leitor = new FileReader()
      leitor.onload = () => {
        if (typeof leitor.result === "string") {
          setImagensTemporarias((prev) => [...prev, leitor.result])
        }
      }
      leitor.readAsDataURL(arquivo)
    })
  }

  const destinatariosDisponiveis = catalogoDestinatarios.filter((destinatario) => {
    const naoSelecionado = !novoComunicado.destinatarios.some((item) => item.id === destinatario.id)
    const bateBusca = destinatario.nome.toLowerCase().includes(buscaDestinatario.toLowerCase())
    return naoSelecionado && bateBusca
  })

  const naoLidos = comunicados.filter((c) => !c.lido).length
  const possuiConteudoValido = Boolean(novoComunicado.conteudo.trim()) || imagensTemporarias.length > 0

  return (
    <div className="h-[calc(100vh-5rem)]">
      <Dialog
        open={dialogAberto}
        onOpenChange={(aberto) => {
          setDialogAberto(aberto)
          if (!aberto) resetFormulario()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Novo comunicado</DialogTitle>
            <DialogDescription>
              Escolha destinatarios por tags, cole imagens e salve como rascunho quando quiser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="titulo-comunicado">Titulo</Label>
              <Input
                id="titulo-comunicado"
                placeholder="Ex.: Reuniao com responsaveis"
                value={novoComunicado.titulo}
                onChange={(e) => setNovoComunicado((prev) => ({ ...prev, titulo: e.target.value }))}
                className="h-11 rounded-xl bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo-comunicado">Conteudo</Label>
              <Textarea
                id="conteudo-comunicado"
                rows={7}
                placeholder="Escreva seu comunicado. Voce pode colar imagens diretamente aqui."
                value={novoComunicado.conteudo}
                onChange={(e) => setNovoComunicado((prev) => ({ ...prev, conteudo: e.target.value }))}
                onPaste={processarImagemClipboard}
                className="resize-none rounded-xl bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">Atalho: Ctrl + V para colar imagem da area de transferencia.</p>
            </div>

            <div className="space-y-2">
              <Label>Imagens anexadas</Label>
              {imagensTemporarias.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagensTemporarias.map((imagem, index) => (
                    <div key={`${imagem.slice(0, 20)}-${index}`} className="relative overflow-hidden rounded-xl border border-border/70">
                      <img src={imagem} alt={`Imagem colada ${index + 1}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagensTemporarias((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-muted-foreground transition hover:text-destructive"
                        aria-label="Remover imagem"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <ImagePlus className="h-4 w-4" />
                  Cole imagens para anexar ao comunicado.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Destinatarios dinamicos</Label>
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {novoComunicado.destinatarios.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum destinatario selecionado.</span>
                  )}
                  {novoComunicado.destinatarios.map((destinatario) => (
                    <Badge key={destinatario.id} variant="secondary" className="flex items-center gap-1 rounded-full px-2.5 py-1">
                      <Tag className="h-3 w-3" />
                      {destinatario.nome}
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                        onClick={() => removerDestinatario(destinatario.id)}
                        aria-label={`Remover ${destinatario.nome}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <Input
                  placeholder="Buscar por aluno, turma ou responsavel..."
                  value={buscaDestinatario}
                  onChange={(e) => setBuscaDestinatario(e.target.value)}
                  className="h-10 rounded-xl bg-background"
                />
                <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-border/60 bg-background/80 p-1">
                  {destinatariosDisponiveis.length > 0 ? (
                    destinatariosDisponiveis.map((destinatario) => (
                      <button
                        key={destinatario.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition hover:bg-secondary"
                        onClick={() => adicionarDestinatario(destinatario)}
                      >
                        <span>{destinatario.nome}</span>
                        {badgeTipo(destinatario.tipo)}
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-muted-foreground">Nenhum destinatario encontrado.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              disabled={!novoComunicado.titulo.trim() || !possuiConteudoValido || novoComunicado.destinatarios.length === 0}
              onClick={() => criarComunicado("rascunho")}
            >
              <Save className="h-4 w-4" />
              Salvar rascunho
            </Button>
            <Button
              className="gap-2 rounded-xl bg-linear-to-br from-primary to-primary/80 shadow-soft"
              disabled={!novoComunicado.titulo.trim() || !possuiConteudoValido || novoComunicado.destinatarios.length === 0}
              onClick={() => criarComunicado("publicado")}
            >
              <Send className="h-4 w-4" />
              Publicar comunicado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Button size="sm" className="h-10 gap-2 rounded-xl" onClick={() => setDialogAberto(true)}>
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {comunicados.map((comunicado) => (
                  <button
                    key={comunicado.id}
                    onClick={() => selecionarComunicado(comunicado)}
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
                <Button size="sm" className="h-10 gap-2 rounded-xl" onClick={() => setDialogAberto(true)}>
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
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
                    onClick={() => selecionarComunicado(comunicado)}
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
                  <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {comunicadoSelecionado.titulo}
                  </h2>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{comunicadoSelecionado.autor}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {comunicadoSelecionado.dataHora}
                    </span>
                  </div>
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
