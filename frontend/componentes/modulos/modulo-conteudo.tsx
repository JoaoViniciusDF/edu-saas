"use client"

import * as React from "react"
import { 
  FileText, 
  Headphones, 
  Image, 
  Video, 
  Clock, 
  Play, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Folder,
  Plus,
  MoreHorizontal,
  X,
  ExternalLink,
  Eye,
  Upload,
  FileUp,
  StickyNote,
  Link2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

// Tipos
interface Pasta {
  id: string
  nome: string
  cor: string
  icone: string
  quantidadeMateriais: number
  ultimaAtualizacao: string
}

interface MaterialEstudo {
  id: string
  titulo: string
  descricao: string
  disciplina: string
  corDisciplina: string
  tipoAnexo: "pdf" | "audio" | "imagem" | "video" | "nota"
  dataHora: string
  duracao?: string
  conteudo?: string
  urlArquivo?: string
  /** Nomes dos arquivos anexados à nota (apenas demonstração local) */
  anexosNomes?: string[]
}

// Dados das pastas
const pastas: Pasta[] = [
  { id: "matematica", nome: "Matemática", cor: "from-blue-500 to-blue-600", icone: "calc", quantidadeMateriais: 12, ultimaAtualizacao: "Hoje" },
  { id: "historia", nome: "História", cor: "from-amber-500 to-amber-600", icone: "book", quantidadeMateriais: 8, ultimaAtualizacao: "Ontem" },
  { id: "fisica", nome: "Física", cor: "from-violet-500 to-violet-600", icone: "atom", quantidadeMateriais: 15, ultimaAtualizacao: "Hoje" },
  { id: "quimica", nome: "Química", cor: "from-emerald-500 to-emerald-600", icone: "flask", quantidadeMateriais: 6, ultimaAtualizacao: "15/04" },
  { id: "portugues", nome: "Português", cor: "from-rose-500 to-rose-600", icone: "text", quantidadeMateriais: 10, ultimaAtualizacao: "13/04" },
  { id: "biologia", nome: "Biologia", cor: "from-green-500 to-green-600", icone: "leaf", quantidadeMateriais: 9, ultimaAtualizacao: "12/04" },
  { id: "geografia", nome: "Geografia", cor: "from-cyan-500 to-cyan-600", icone: "globe", quantidadeMateriais: 7, ultimaAtualizacao: "10/04" },
  { id: "ingles", nome: "Inglês", cor: "from-indigo-500 to-indigo-600", icone: "lang", quantidadeMateriais: 11, ultimaAtualizacao: "09/04" },
]

const corDisciplinaPorPastaId: Record<string, string> = {
  matematica: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  historia: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  fisica: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  quimica: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  portugues: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  biologia: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  geografia: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  ingles: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
}

// Dados dos materiais por pasta (estado inicial)
const materiaisPorPastaInicial: Record<string, MaterialEstudo[]> = {
  matematica: [
    {
      id: "1",
      titulo: "Introdução às Equações de 2º Grau",
      descricao: "Material completo sobre resolução de equações quadráticas com exercícios práticos e exemplos do cotidiano.",
      disciplina: "Matemática",
      corDisciplina: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      tipoAnexo: "pdf",
      dataHora: "Hoje, 14:30",
      duracao: "15 páginas",
      conteudo: "As equações de 2º grau são fundamentais na matemática e aparecem em diversos contextos do cotidiano. Neste material, você aprenderá sobre a fórmula de Bhaskara, discriminante e interpretação geométrica das soluções..."
    },
    {
      id: "2",
      titulo: "Videoaula: Funções Quadráticas",
      descricao: "Aula completa sobre gráficos e propriedades das funções do segundo grau.",
      disciplina: "Matemática",
      corDisciplina: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      tipoAnexo: "video",
      dataHora: "Ontem, 10:00",
      duracao: "25 min",
      conteudo: "Nesta videoaula você aprenderá a construir gráficos de parábolas, identificar vértices, zeros da função e muito mais."
    },
    {
      id: "3",
      titulo: "Exercícios Resolvidos - Equações",
      descricao: "Lista com 50 exercícios resolvidos passo a passo sobre equações quadráticas.",
      disciplina: "Matemática",
      corDisciplina: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      tipoAnexo: "pdf",
      dataHora: "12/04/2026",
      duracao: "32 páginas",
      conteudo: "Exercícios organizados por nível de dificuldade, do básico ao avançado, com resoluções detalhadas."
    },
  ],
  historia: [
    {
      id: "4",
      titulo: "Podcast: Revolução Francesa",
      descricao: "Episódio especial sobre os principais eventos e personagens da Revolução Francesa.",
      disciplina: "História",
      corDisciplina: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      tipoAnexo: "audio",
      dataHora: "Hoje, 10:15",
      duracao: "32 min",
      conteudo: "Neste podcast, exploramos a queda da Bastilha, o papel de figuras como Robespierre e Napoleão, e as consequências duradouras da revolução."
    },
    {
      id: "5",
      titulo: "Infográfico: Linha do Tempo",
      descricao: "Visualização cronológica dos principais eventos da história mundial.",
      disciplina: "História",
      corDisciplina: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      tipoAnexo: "imagem",
      dataHora: "Ontem, 16:00",
      conteudo: "Linha do tempo interativa mostrando eventos desde a Antiguidade até os dias atuais."
    },
  ],
  fisica: [
    {
      id: "6",
      titulo: "Diagrama: Sistema Solar",
      descricao: "Infográfico interativo mostrando a posição e características dos planetas do nosso sistema.",
      disciplina: "Física",
      corDisciplina: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      tipoAnexo: "imagem",
      dataHora: "Ontem, 16:45",
      conteudo: "Explore as características de cada planeta, suas órbitas, tamanhos relativos e curiosidades astronômicas."
    },
    {
      id: "7",
      titulo: "Videoaula: Leis de Newton",
      descricao: "Explicação detalhada das três leis fundamentais da mecânica clássica.",
      disciplina: "Física",
      corDisciplina: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      tipoAnexo: "video",
      dataHora: "13/04/2026",
      duracao: "40 min",
      conteudo: "As leis de Newton formam a base da mecânica clássica. Aprenda sobre inércia, força e ação-reação."
    },
  ],
  quimica: [
    {
      id: "8",
      titulo: "Videoaula: Reações Químicas",
      descricao: "Demonstração prática de diferentes tipos de reações químicas em laboratório.",
      disciplina: "Química",
      corDisciplina: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      tipoAnexo: "video",
      dataHora: "Ontem, 09:00",
      duracao: "18 min",
      conteudo: "Veja na prática reações de combustão, oxidação, neutralização e muito mais."
    },
  ],
  portugues: [
    {
      id: "9",
      titulo: "Análise Literária - Dom Casmurro",
      descricao: "Estudo aprofundado sobre a obra de Machado de Assis com questões interpretativas.",
      disciplina: "Português",
      corDisciplina: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      tipoAnexo: "pdf",
      dataHora: "15/04/2026",
      duracao: "22 páginas",
      conteudo: "Análise dos principais temas, personagens e técnicas narrativas utilizadas por Machado de Assis em sua obra-prima."
    },
    {
      id: "10",
      titulo: "Podcast: Modernismo Brasileiro",
      descricao: "Discussão sobre o movimento modernista e seus principais autores.",
      disciplina: "Português",
      corDisciplina: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      tipoAnexo: "audio",
      dataHora: "10/04/2026",
      duracao: "45 min",
      conteudo: "Exploramos a Semana de Arte Moderna de 1922 e a revolução cultural que ela representou."
    },
  ],
  biologia: [
    {
      id: "11",
      titulo: "Célula Animal vs Vegetal",
      descricao: "Comparativo visual entre os dois tipos de células eucariontes.",
      disciplina: "Biologia",
      corDisciplina: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
      tipoAnexo: "imagem",
      dataHora: "11/04/2026",
      conteudo: "Infográfico detalhado mostrando as diferenças entre células animais e vegetais, incluindo organelas exclusivas."
    },
  ],
  geografia: [
    {
      id: "12",
      titulo: "Mapas: Biomas Brasileiros",
      descricao: "Coleção de mapas ilustrativos dos biomas do Brasil.",
      disciplina: "Geografia",
      corDisciplina: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      tipoAnexo: "imagem",
      dataHora: "08/04/2026",
      conteudo: "Explore os seis biomas brasileiros: Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal."
    },
  ],
  ingles: [
    {
      id: "13",
      titulo: "Podcast: English Conversation",
      descricao: "Prática de conversação em inglês com situações do dia a dia.",
      disciplina: "Inglês",
      corDisciplina: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      tipoAnexo: "audio",
      dataHora: "07/04/2026",
      duracao: "20 min",
      conteudo: "Diálogos em situações reais: restaurante, aeroporto, entrevista de emprego e mais."
    },
  ],
}

const iconesTipoAnexo = {
  pdf: FileText,
  audio: Headphones,
  imagem: Image,
  video: Video,
  nota: StickyNote,
}

const coresIconeAnexo = {
  pdf: "from-red-500 to-red-600",
  audio: "from-violet-500 to-violet-600",
  imagem: "from-emerald-500 to-emerald-600",
  video: "from-orange-500 to-orange-600",
  nota: "from-amber-500 to-amber-600",
}

const bgIconeAnexo = {
  pdf: "bg-red-500/10 text-red-500",
  audio: "bg-violet-500/10 text-violet-500",
  imagem: "bg-emerald-500/10 text-emerald-500",
  video: "bg-orange-500/10 text-orange-500",
  nota: "bg-amber-500/10 text-amber-600",
}

// Componente de visualização de pasta (grid estilo Fotos Apple)
function VisualizacaoPastas({
  pastasLista,
  materiaisPorPastaMap,
  aoSelecionarPasta,
}: {
  pastasLista: Pasta[]
  materiaisPorPastaMap: Record<string, MaterialEstudo[]>
  aoSelecionarPasta: (id: string) => void
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Conteúdo</span>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            Conteúdo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Seus materiais organizados por disciplina
          </p>
        </div>
        <Button className="rounded-xl gap-2 shadow-soft">
          <Plus className="h-4 w-4" />
          Nova Pasta
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {pastasLista.map((pasta) => (
          <button
            key={pasta.id}
            onClick={() => aoSelecionarPasta(pasta.id)}
            className="group flex flex-col items-center rounded-3xl border border-border/50 bg-card p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-soft-lg active:scale-[0.98] sm:p-6"
          >
            {/* Ícone da pasta */}
            <div className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-soft mb-4 transition-transform duration-300 group-hover:scale-110",
              pasta.cor
            )}>
              <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-white/90" />
            </div>
            
            {/* Info da pasta */}
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate w-full">
              {pasta.nome}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {(materiaisPorPastaMap[pasta.id]?.length ?? pasta.quantidadeMateriais)} itens
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {pasta.ultimaAtualizacao}
            </p>
          </button>
        ))}

        <button
          className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border p-4 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 sm:min-h-[200px] sm:p-6"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">Criar Pasta</span>
        </button>
      </div>
    </div>
  )
}

// Componente de visualização de timeline dentro da pasta
function VisualizacaoTimeline({ 
  pastaId,
  materiais,
  aoVoltar,
  aoAbrirMaterial,
  aoAbrirCriarNota,
}: { 
  pastaId: string
  materiais: MaterialEstudo[]
  aoVoltar: () => void
  aoAbrirMaterial: (material: MaterialEstudo) => void
  aoAbrirCriarNota: () => void
}) {
  const pasta = pastas.find(p => p.id === pastaId)
  const [filtroAtivo, setFiltroAtivo] = React.useState("Todos")

  const materiaisFiltrados = filtroAtivo === "Todos" 
    ? materiais 
    : materiais.filter(m => {
        const tipoMap: Record<string, string> = {
          "PDF": "pdf",
          "Vídeo": "video",
          "Áudio": "audio",
          "Imagem": "imagem",
          "Nota": "nota",
        }
        return m.tipoAnexo === tipoMap[filtroAtivo]
      })

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button type="button" onClick={aoVoltar} className="rounded-lg font-medium text-foreground hover:underline">
          Conteúdo
        </button>
        <ChevronRight className="mx-1 h-4 w-4 shrink-0" />
        <span className="font-medium text-foreground">{pasta?.nome}</span>
      </div>

      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-soft",
              pasta?.cor
            )}>
              <Folder className="w-7 h-7 text-white/90" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                {pasta?.nome}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {materiais.length} materiais disponíveis
              </p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={aoVoltar}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button className="w-full shrink-0 gap-2 rounded-xl shadow-soft sm:w-auto" onClick={aoAbrirCriarNota}>
            <StickyNote className="h-4 w-4" />
            Criar nota e anexar arquivos
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["Todos", "PDF", "Vídeo", "Áudio", "Imagem", "Nota"].map((filtro) => (
          <button
            key={filtro}
            onClick={() => setFiltroAtivo(filtro)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              filtroAtivo === filtro 
                ? "bg-primary text-primary-foreground shadow-soft" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {filtro}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {materiaisFiltrados.length > 0 ? (
        <div className="relative">
          {/* Linha vertical da timeline - escondida em mobile */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/50 via-border to-border hidden sm:block" />

          <div className="space-y-4 sm:space-y-6">
            {materiaisFiltrados.map((material) => {
              const IconeAnexo = iconesTipoAnexo[material.tipoAnexo]
              
              return (
                <div key={material.id} className="relative flex gap-4 sm:gap-6 group">
                  {/* Ponto da timeline - escondido em mobile */}
                  <div className="relative z-10 hidden sm:block">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:shadow-soft-lg",
                      coresIconeAnexo[material.tipoAnexo]
                    )}>
                      <IconeAnexo className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Card do material */}
                  <Card className="flex-1 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-soft-lg hover:border-primary/30 group/card overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Ícone mobile */}
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl shrink-0 sm:hidden",
                          bgIconeAnexo[material.tipoAnexo]
                        )}>
                          <IconeAnexo className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className={cn("font-medium rounded-full px-3 py-0.5 text-xs", material.corDisciplina)}>
                              {material.disciplina}
                            </Badge>
                            {material.duracao && (
                              <span className="text-xs text-muted-foreground font-medium">
                                {material.duracao}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover/card:text-primary transition-colors line-clamp-2">
                            {material.titulo}
                          </h3>
                          
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {material.descricao}
                          </p>
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{material.dataHora}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {(material.tipoAnexo === "video" || material.tipoAnexo === "audio") && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="h-8 gap-1.5 rounded-lg"
                                onClick={() => aoAbrirMaterial(material)}
                              >
                                <Eye className="h-4 w-4" />
                                Abrir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum material encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Não há materiais do tipo selecionado nesta pasta.
          </p>
        </div>
      )}

      {/* Load more */}
      {materiaisFiltrados.length > 0 && (
        <div className="mt-8 text-center">
          <Button variant="outline" className="rounded-full px-8">
            Carregar mais conteúdos
          </Button>
        </div>
      )}
    </div>
  )
}

function ModalCriarNota({
  aberto,
  aoFechar,
  nomePasta,
  pastaId,
  aoConfirmar,
}: {
  aberto: boolean
  aoFechar: () => void
  nomePasta: string
  pastaId: string
  aoConfirmar: (dados: {
    titulo: string
    conteudo: string
    nomesAnexos: string[]
  }) => void
}) {
  const [titulo, setTitulo] = React.useState("")
  const [conteudo, setConteudo] = React.useState("")
  const [arquivos, setArquivos] = React.useState<File[]>([])

  React.useEffect(() => {
    if (!aberto) {
      setTitulo("")
      setConteudo("")
      setArquivos([])
    }
  }, [aberto])

  const aoSelecionarArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = e.target.files ? Array.from(e.target.files) : []
    setArquivos(lista)
  }

  const submeter = () => {
    if (!titulo.trim()) return
    aoConfirmar({
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      nomesAnexos: arquivos.map((f) => f.name),
    })
    aoFechar()
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(open) => {
        if (!open) aoFechar()
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-3xl gap-4" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Nova nota na pasta
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {nomePasta}
            <span className="sr-only"> — id {pastaId}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nota-titulo">Título</Label>
            <Input
              id="nota-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Resumo da aula"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nota-conteudo">Conteúdo da nota</Label>
            <Textarea
              id="nota-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva sua nota para a timeline..."
              className="rounded-xl min-h-[120px] resize-y"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nota-anexos">Anexar arquivos</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="nota-anexos"
                type="file"
                multiple
                className="cursor-pointer rounded-xl"
                onChange={aoSelecionarArquivos}
              />
            </div>
            {arquivos.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 max-h-24 overflow-y-auto border border-border/50 rounded-xl p-3 bg-secondary/30">
                {arquivos.map((f) => (
                  <li key={f.name + f.size}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="button" className="rounded-xl" onClick={submeter} disabled={!titulo.trim()}>
            Adicionar à timeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Modal de visualização de conteúdo
function ModalConteudo({ 
  material, 
  aberto, 
  aoFechar 
}: { 
  material: MaterialEstudo | null
  aberto: boolean
  aoFechar: () => void
}) {
  if (!material) return null

  const IconeAnexo = iconesTipoAnexo[material.tipoAnexo]

  return (
    <Dialog open={aberto} onOpenChange={aoFechar}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-soft shrink-0",
              coresIconeAnexo[material.tipoAnexo]
            )}>
              <IconeAnexo className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn("font-medium rounded-full px-3 py-0.5 text-xs", material.corDisciplina)}>
                  {material.disciplina}
                </Badge>
                {material.duracao && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {material.duracao}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                {material.titulo}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {/* Preview área */}
          <div className="mb-6">
            {material.tipoAnexo === "video" && (
              <div className="aspect-video bg-secondary rounded-2xl flex items-center justify-center">
                <Button size="lg" className="rounded-full w-16 h-16 shadow-soft">
                  <Play className="h-8 w-8 ml-1" />
                </Button>
              </div>
            )}
            {material.tipoAnexo === "audio" && (
              <div className="h-32 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center gap-4 p-6">
                <Button size="lg" className="rounded-full w-14 h-14 shadow-soft">
                  <Play className="h-6 w-6 ml-0.5" />
                </Button>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-primary rounded-full" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{material.duracao}</span>
              </div>
            )}
            {material.tipoAnexo === "imagem" && (
              <div className="aspect-video bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl flex items-center justify-center">
                <Image className="w-16 h-16 text-emerald-500/50" />
              </div>
            )}
            {material.tipoAnexo === "pdf" && (
              <div className="aspect-[3/4] max-h-[300px] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center">
                <FileText className="w-16 h-16 text-red-500/50" />
              </div>
            )}
            {material.tipoAnexo === "nota" && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
                <div className="flex items-center gap-3">
                  <StickyNote className="h-10 w-10 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Nota na timeline</p>
                    <p className="text-xs text-muted-foreground">
                      {material.anexosNomes?.length
                        ? `${material.anexosNomes.length} arquivo(s) anexado(s)`
                        : "Sem anexos"}
                    </p>
                  </div>
                </div>
                {material.anexosNomes && material.anexosNomes.length > 0 && (
                  <ul className="mt-4 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    {material.anexosNomes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Descrição</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {material.descricao}
              </p>
            </div>

            {material.conteudo && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Sobre o conteúdo</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {material.conteudo}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Adicionado em {material.dataHora}</span>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex-shrink-0 pt-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl gap-2">
            <Download className="h-4 w-4" />
            Baixar
          </Button>
          <Button className="flex-1 rounded-xl gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir em nova aba
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente principal
function clonarMateriaisIniciais(): Record<string, MaterialEstudo[]> {
  return JSON.parse(JSON.stringify(materiaisPorPastaInicial)) as Record<
    string,
    MaterialEstudo[]
  >
}

export function ModuloConteudo() {
  const [pastaAtiva, setPastaAtiva] = React.useState<string | null>(null)
  const [materialAberto, setMaterialAberto] = React.useState<MaterialEstudo | null>(null)
  const [modalAberto, setModalAberto] = React.useState(false)
  const [materiaisPorPastaState, setMateriaisPorPastaState] = React.useState<
    Record<string, MaterialEstudo[]>
  >(() => clonarMateriaisIniciais())
  const [modalCriarNotaAberto, setModalCriarNotaAberto] = React.useState(false)

  const abrirMaterial = (material: MaterialEstudo) => {
    setMaterialAberto(material)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setTimeout(() => setMaterialAberto(null), 200)
  }

  const confirmarNovaNota = (dados: {
    titulo: string
    conteudo: string
    nomesAnexos: string[]
  }) => {
    if (!pastaAtiva) return
    const pasta = pastas.find((p) => p.id === pastaAtiva)
    const agora = new Date()
    const dataHora = agora.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const novo: MaterialEstudo = {
      id: `nota-${Date.now()}`,
      titulo: dados.titulo,
      descricao:
        dados.conteudo.slice(0, 160) +
        (dados.conteudo.length > 160 ? "…" : ""),
      disciplina: pasta?.nome ?? "Conteúdo",
      corDisciplina:
        corDisciplinaPorPastaId[pastaAtiva] ??
        "bg-secondary text-foreground border-border",
      tipoAnexo: "nota",
      dataHora,
      conteudo: dados.conteudo || undefined,
      anexosNomes: dados.nomesAnexos.length ? dados.nomesAnexos : undefined,
      duracao:
        dados.nomesAnexos.length > 0
          ? `${dados.nomesAnexos.length} anexo(s)`
          : undefined,
    }
    setMateriaisPorPastaState((prev) => ({
      ...prev,
      [pastaAtiva]: [novo, ...(prev[pastaAtiva] ?? [])],
    }))
  }

  return (
    <>
      {pastaAtiva ? (
        <VisualizacaoTimeline
          pastaId={pastaAtiva}
          materiais={materiaisPorPastaState[pastaAtiva] ?? []}
          aoVoltar={() => setPastaAtiva(null)}
          aoAbrirMaterial={abrirMaterial}
          aoAbrirCriarNota={() => setModalCriarNotaAberto(true)}
        />
      ) : (
        <VisualizacaoPastas
          pastasLista={pastas}
          materiaisPorPastaMap={materiaisPorPastaState}
          aoSelecionarPasta={setPastaAtiva}
        />
      )}

      <ModalConteudo
        material={materialAberto}
        aberto={modalAberto}
        aoFechar={fecharModal}
      />

      {pastaAtiva && (
        <ModalCriarNota
          aberto={modalCriarNotaAberto}
          aoFechar={() => setModalCriarNotaAberto(false)}
          pastaId={pastaAtiva}
          nomePasta={pastas.find((p) => p.id === pastaAtiva)?.nome ?? ""}
          aoConfirmar={confirmarNovaNota}
        />
      )}
    </>
  )
}
