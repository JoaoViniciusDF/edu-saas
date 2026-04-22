"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

interface RegistroDesempenho {
  data: string
  turma: string
  aluno: string
  media: number
  matematica: number
  portugues: number
  historia: number
  geografia: number
  fisica: number
  quimica: number
  pendentes: number
  aprovacao: number
}

const registros: RegistroDesempenho[] = [
  { data: "2026-01-14", turma: "Turma A", aluno: "Ana Souza", media: 7.1, matematica: 7.8, portugues: 7.2, historia: 7.5, geografia: 6.9, fisica: 6.6, quimica: 6.8, pendentes: 3, aprovacao: 88 },
  { data: "2026-01-21", turma: "Turma B", aluno: "Joao Lima", media: 6.8, matematica: 7.1, portugues: 6.9, historia: 7.0, geografia: 6.5, fisica: 6.2, quimica: 6.4, pendentes: 4, aprovacao: 82 },
  { data: "2026-02-10", turma: "Turma A", aluno: "Camila Rocha", media: 7.4, matematica: 8.1, portugues: 7.6, historia: 7.8, geografia: 7.0, fisica: 6.9, quimica: 7.1, pendentes: 3, aprovacao: 90 },
  { data: "2026-02-18", turma: "Turma B", aluno: "Pedro Costa", media: 7.0, matematica: 7.2, portugues: 7.4, historia: 7.1, geografia: 6.7, fisica: 6.4, quimica: 6.8, pendentes: 4, aprovacao: 86 },
  { data: "2026-03-12", turma: "Turma A", aluno: "Ana Souza", media: 7.6, matematica: 8.2, portugues: 7.8, historia: 8.0, geografia: 7.4, fisica: 7.1, quimica: 7.2, pendentes: 2, aprovacao: 91 },
  { data: "2026-03-23", turma: "Turma B", aluno: "Joao Lima", media: 7.2, matematica: 7.4, portugues: 7.3, historia: 7.2, geografia: 6.8, fisica: 6.8, quimica: 7.0, pendentes: 3, aprovacao: 87 },
  { data: "2026-04-08", turma: "Turma A", aluno: "Camila Rocha", media: 7.8, matematica: 8.3, portugues: 8.0, historia: 8.1, geografia: 7.5, fisica: 7.3, quimica: 7.4, pendentes: 2, aprovacao: 93 },
  { data: "2026-04-19", turma: "Turma B", aluno: "Pedro Costa", media: 7.1, matematica: 7.3, portugues: 7.5, historia: 7.2, geografia: 6.9, fisica: 6.6, quimica: 6.9, pendentes: 3, aprovacao: 88 },
]

const disciplinaLabels = [
  { key: "matematica", label: "Matematica" },
  { key: "portugues", label: "Portugues" },
  { key: "historia", label: "Historia" },
  { key: "geografia", label: "Geografia" },
  { key: "fisica", label: "Fisica" },
  { key: "quimica", label: "Quimica" },
] as const

interface CartaoResumoProps {
  titulo: string
  valor: string
  descricao: string
  icone: React.ReactNode
  tendencia?: {
    valor: string
    positiva: boolean
  }
  corIcone?: string
}

function CartaoResumo({ titulo, valor, descricao, icone, tendencia, corIcone }: CartaoResumoProps) {
  return (
    <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-soft">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", corIcone || "bg-primary/10")}>{icone}</div>
          {tendencia && (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                tendencia.positiva
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              {tendencia.positiva ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
              {tendencia.valor}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            {valor}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">{descricao}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ModuloDashboard() {
  const [escopo, setEscopo] = React.useState<"geral" | "turma" | "aluno">("geral")
  const [turmaSelecionada, setTurmaSelecionada] = React.useState("todas")
  const [alunoSelecionado, setAlunoSelecionado] = React.useState("todos")
  const [dataInicio, setDataInicio] = React.useState("2026-01-01")
  const [dataFim, setDataFim] = React.useState("2026-04-30")

  const turmas = React.useMemo(() => ["todas", ...Array.from(new Set(registros.map((item) => item.turma)))], [])
  const alunos = React.useMemo(() => ["todos", ...Array.from(new Set(registros.map((item) => item.aluno)))], [])

  const registrosFiltrados = React.useMemo(() => {
    const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null
    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : null

    return registros.filter((item) => {
      const data = new Date(`${item.data}T00:00:00`)
      const dentroJanela = (!inicio || data >= inicio) && (!fim || data <= fim)
      if (!dentroJanela) return false

      if (escopo === "turma") return turmaSelecionada === "todas" ? true : item.turma === turmaSelecionada
      if (escopo === "aluno") return alunoSelecionado === "todos" ? true : item.aluno === alunoSelecionado
      return true
    })
  }, [dataInicio, dataFim, escopo, turmaSelecionada, alunoSelecionado])

  const dadosDesempenhoTempo = React.useMemo(() => {
    const mapa = new Map<string, { mes: string; media: number; turmaA: number; turmaB: number; count: number; countA: number; countB: number }>()

    registrosFiltrados.forEach((item) => {
      const chave = item.data.slice(0, 7)
      const mes = new Date(`${item.data}T00:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
      if (!mapa.has(chave)) {
        mapa.set(chave, { mes: mes.charAt(0).toUpperCase() + mes.slice(1), media: 0, turmaA: 0, turmaB: 0, count: 0, countA: 0, countB: 0 })
      }

      const atual = mapa.get(chave)!
      atual.media += item.media
      atual.count += 1
      if (item.turma === "Turma A") {
        atual.turmaA += item.media
        atual.countA += 1
      }
      if (item.turma === "Turma B") {
        atual.turmaB += item.media
        atual.countB += 1
      }
    })

    return Array.from(mapa.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, valor]) => ({
        mes: valor.mes,
        media: Number((valor.media / Math.max(1, valor.count)).toFixed(2)),
        turmaA: Number((valor.countA ? valor.turmaA / valor.countA : 0).toFixed(2)),
        turmaB: Number((valor.countB ? valor.turmaB / valor.countB : 0).toFixed(2)),
      }))
  }, [registrosFiltrados])

  const dadosDisciplinas = React.useMemo(() => {
    if (registrosFiltrados.length === 0) return []

    return disciplinaLabels.map((disciplina) => {
      const soma = registrosFiltrados.reduce((total, item) => total + item[disciplina.key], 0)
      const media = soma / registrosFiltrados.length
      return { disciplina: disciplina.label, nota: Number(media.toFixed(2)), meta: 7.5 }
    })
  }, [registrosFiltrados])

  const mediaGeral = React.useMemo(() => {
    if (registrosFiltrados.length === 0) return 0
    const soma = registrosFiltrados.reduce((total, item) => total + item.media, 0)
    return soma / registrosFiltrados.length
  }, [registrosFiltrados])

  const taxaAprovacao = React.useMemo(() => {
    if (registrosFiltrados.length === 0) return 0
    const soma = registrosFiltrados.reduce((total, item) => total + item.aprovacao, 0)
    return soma / registrosFiltrados.length
  }, [registrosFiltrados])

  const pendenciasMedia = React.useMemo(() => {
    if (registrosFiltrados.length === 0) return 0
    const soma = registrosFiltrados.reduce((total, item) => total + item.pendentes, 0)
    return Math.round(soma / registrosFiltrados.length)
  }, [registrosFiltrados])

  const totalAlunos = React.useMemo(() => new Set(registrosFiltrados.map((item) => item.aluno)).size, [registrosFiltrados])

  const disciplinaCritica = React.useMemo(() => {
    if (dadosDisciplinas.length === 0) return null
    return [...dadosDisciplinas].sort((a, b) => a.nota - b.nota)[0]
  }, [dadosDisciplinas])

  const descricaoEscopo =
    escopo === "geral"
      ? "Visao consolidada"
      : escopo === "turma"
        ? `Filtro por turma (${turmaSelecionada === "todas" ? "todas" : turmaSelecionada})`
        : `Filtro por aluno (${alunoSelecionado === "todos" ? "todos" : alunoSelecionado})`

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">Analise de desempenho com filtros por escopo e periodo</p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 rounded-full px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Atualizado agora
        </Badge>
      </div>

      <Card className="rounded-2xl border-border/50 bg-card/80">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <LabelFiltro>Escopo</LabelFiltro>
            <Select value={escopo} onValueChange={(valor) => setEscopo(valor as "geral" | "turma" | "aluno")}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="turma">Por turma</SelectItem>
                <SelectItem value="aluno">Por aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={cn("space-y-1", escopo !== "turma" && "opacity-60")}>
            <LabelFiltro>Turma</LabelFiltro>
            <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada} disabled={escopo !== "turma"}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma} value={turma}>
                    {turma === "todas" ? "Todas" : turma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={cn("space-y-1", escopo !== "aluno" && "opacity-60")}>
            <LabelFiltro>Aluno</LabelFiltro>
            <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado} disabled={escopo !== "aluno"}>
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno} value={aluno}>
                    {aluno === "todos" ? "Todos" : aluno}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <LabelFiltro>Data inicio</LabelFiltro>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-10 rounded-xl" />
          </div>

          <div className="space-y-1">
            <LabelFiltro>Data fim</LabelFiltro>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CartaoResumo
          titulo="Total de Alunos"
          valor={String(totalAlunos)}
          descricao={descricaoEscopo}
          icone={<Users className="h-6 w-6 text-primary" />}
          corIcone="bg-primary/10"
        />
        <CartaoResumo
          titulo="Media Geral"
          valor={mediaGeral.toFixed(1)}
          descricao="Todas as disciplinas"
          icone={<GraduationCap className="h-6 w-6 text-emerald-500" />}
          corIcone="bg-emerald-500/10"
          tendencia={{ valor: mediaGeral >= 7 ? "+0.2" : "-0.1", positiva: mediaGeral >= 7 }}
        />
        <CartaoResumo
          titulo="Avaliacoes"
          valor={String(pendenciasMedia)}
          descricao="Pendentes de correcao"
          icone={<ClipboardList className="h-6 w-6 text-amber-500" />}
          corIcone="bg-amber-500/10"
        />
        <CartaoResumo
          titulo="Taxa de Aprovacao"
          valor={`${taxaAprovacao.toFixed(0)}%`}
          descricao="Meta acima de 85%"
          icone={<Target className="h-6 w-6 text-violet-500" />}
          corIcone="bg-violet-500/10"
          tendencia={{ valor: taxaAprovacao >= 85 ? "+2%" : "-1%", positiva: taxaAprovacao >= 85 }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Evolucao do desempenho</CardTitle>
            <CardDescription>Media das notas no periodo selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosDesempenhoTempo}>
                  <defs>
                    <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[5, 10]} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                  <Area type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gradientPrimary)" name="Media geral" />
                  <Line type="monotone" dataKey="turmaA" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0 }} name="Turma A" />
                  <Line type="monotone" dataKey="turmaB" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 0 }} name="Turma B" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Desempenho por disciplina</CardTitle>
            <CardDescription>Comparacao entre nota atual e meta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosDisciplinas} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal vertical={false} />
                  <XAxis type="number" domain={[0, 10]} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="disciplina" type="category" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                  <Bar dataKey="nota" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Nota atual" />
                  <Bar dataKey="meta" fill="hsl(var(--muted))" radius={[0, 6, 6, 0]} name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 shadow-soft">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Insights</CardTitle>
              <CardDescription>Analises e recomendacoes com base no filtro atual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InsightCard
              titulo={disciplinaCritica ? `Atenção em ${disciplinaCritica.disciplina}` : "Sem dados suficientes"}
              descricao={
                disciplinaCritica
                  ? `${disciplinaCritica.disciplina} esta com media ${disciplinaCritica.nota.toFixed(1)}. Recomende revisoes orientadas para esse grupo.`
                  : "Ajuste os filtros para visualizar metricas e recomendacoes."
              }
              icone={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              cor="bg-amber-500/10"
            />
            <InsightCard
              titulo="Tendencia de desempenho"
              descricao={`A media atual esta em ${mediaGeral.toFixed(1)} com taxa de aprovacao de ${taxaAprovacao.toFixed(0)}%.`}
              icone={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              cor="bg-emerald-500/10"
            />
            <InsightCard
              titulo="Acao recomendada"
              descricao="Use a combinacao de escopo e periodo para identificar rapidamente onde atuar primeiro."
              icone={<Lightbulb className="h-5 w-5 text-primary" />}
              cor="bg-primary/10"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LabelFiltro({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}

function InsightCard({
  titulo,
  descricao,
  icone,
  cor,
}: {
  titulo: string
  descricao: string
  icone: React.ReactNode
  cor: string
}) {
  return (
    <div className="group cursor-pointer rounded-2xl border border-border/50 bg-secondary/30 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-secondary/50">
      <div className="flex items-start gap-4">
        <div className={cn("shrink-0 rounded-xl p-2.5", cor)}>{icone}</div>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold transition-colors group-hover:text-primary">{titulo}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{descricao}</p>
        </div>
      </div>
    </div>
  )
}
