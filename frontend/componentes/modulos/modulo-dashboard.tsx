"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { dashboardRequests } from "@/lib/api/requests/dashboard"
import { leituraRequests } from "@/lib/api/requests/configuracoes"
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Target,
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
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import type { DashboardSerieItem, DesempenhoMateriaItem } from "@/lib/api/dtos/dashboard"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { queryKeys } from "@/lib/cache/query-keys"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { useTurmaAtiva } from "@/componentes/provedores/provedor-turma-ativa"
import { useFilhoAtivo } from "@/componentes/provedores/provedor-filho-ativo"

const CORES_GRAFICO = [
  "oklch(0.646 0.222 41.116)",
  "oklch(0.6 0.118 184.704)",
  "oklch(0.398 0.07 227.392)",
  "oklch(0.828 0.189 84.429)",
  "oklch(0.769 0.188 70.08)",
] as const

function num(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === "number" ? v : Number(v)
}

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
  const { usuario } = useAuth()
  const { turmaAtivaId } = useTurmaAtiva()
  const { alunoAtivoId, filhos } = useFilhoAtivo()
  const ehProfessor = usuario?.perfil === "professor"
  const ehResponsavel = usuario?.perfil === "responsavel"

  const hoje = new Date()
  const inicioAno = `${hoje.getFullYear()}-01-01`
  const hojeIso = hoje.toISOString().slice(0, 10)

  const [escopo, setEscopo] = React.useState<"geral" | "turma" | "aluno">(
    ehResponsavel ? "aluno" : ehProfessor ? "turma" : "geral"
  )
  const [turmaSelecionada, setTurmaSelecionada] = React.useState("todas")
  const [alunoSelecionado, setAlunoSelecionado] = React.useState("todos")
  const [dataInicio, setDataInicio] = React.useState(inicioAno)
  const [dataFim, setDataFim] = React.useState(hojeIso)

  React.useEffect(() => {
    if (ehProfessor && turmaAtivaId) {
      setEscopo("turma")
      setTurmaSelecionada(turmaAtivaId)
    }
  }, [ehProfessor, turmaAtivaId])

  React.useEffect(() => {
    if (ehResponsavel && alunoAtivoId) {
      setEscopo("aluno")
      setAlunoSelecionado(alunoAtivoId)
    }
  }, [ehResponsavel, alunoAtivoId])

  const queryParams = React.useMemo(
    () => ({
      escopo: ehProfessor ? "turma" : ehResponsavel ? "aluno" : escopo,
      turma_id: ehProfessor
        ? turmaAtivaId ?? undefined
        : escopo === "turma" && turmaSelecionada !== "todas"
          ? turmaSelecionada
          : undefined,
      aluno_id: ehResponsavel
        ? alunoAtivoId ?? undefined
        : escopo === "aluno" && alunoSelecionado !== "todos"
          ? alunoSelecionado
          : undefined,
      data_inicio: dataInicio,
      data_fim: dataFim,
    }),
    [
      escopo,
      turmaSelecionada,
      alunoSelecionado,
      dataInicio,
      dataFim,
      ehProfessor,
      ehResponsavel,
      turmaAtivaId,
      alunoAtivoId,
    ]
  )

  const { data: resumo, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.resumo(queryParams),
    queryFn: () => dashboardRequests.resumo(queryParams),
  })

  const { data: seriesData, isLoading: loadingSeries } = useQuery({
    queryKey: queryKeys.dashboard.series(queryParams),
    queryFn: () => dashboardRequests.series(queryParams),
  })

  const { data: desempenhoAv, isLoading: loadingDesempenhoAv } = useQuery({
    queryKey: queryKeys.dashboard.desempenhoAvaliacoes(queryParams),
    queryFn: () => dashboardRequests.desempenhoAvaliacoes(queryParams),
  })

  const { data: alunosApi = [] } = useQuery({
    queryKey: [...queryKeys.cadastros.alunos(), escopo, alunoAtivoId],
    queryFn: () => cadastrosRequests.listAlunos(),
    enabled: escopo === "aluno" || ehResponsavel,
  })

  const { data: turmasApi = [] } = useQuery({
    queryKey: queryKeys.turmas.resumo(),
    queryFn: () => leituraRequests.listTurmas(),
  })

  const series: DashboardSerieItem[] = seriesData?.items ?? []

  const turmas = React.useMemo(
    () => [
      { id: "todas", nome: "Todas as turmas" },
      ...turmasApi.map((t) => ({ id: t.id, nome: t.nome })),
    ],
    [turmasApi]
  )

  const alunos = React.useMemo(() => {
    if (escopo === "aluno" && alunosApi.length > 0) {
      return [
        { id: "todos", nome: "Todos os alunos" },
        ...alunosApi.map((a) => ({ id: a.id, nome: a.nome_exibicao })),
      ]
    }
    const nomes = new Map<string, string>()
    series.forEach((s) => {
      if (s.aluno_id && s.aluno_nome) nomes.set(s.aluno_id, s.aluno_nome)
    })
    return [{ id: "todos", nome: "Todos os alunos" }, ...Array.from(nomes, ([id, nome]) => ({ id, nome }))]
  }, [series, escopo, alunosApi])

  const dadosDesempenhoTempo = React.useMemo(() => {
    const mapa = new Map<string, { mes: string; media: number; count: number }>()
    series.forEach((item) => {
      const chave = item.periodo.slice(0, 7)
      const mes = new Date(`${item.periodo}T00:00:00`).toLocaleDateString("pt-BR", {
        month: "short",
      }).replace(".", "")
      if (!mapa.has(chave)) {
        mapa.set(chave, { mes: mes.charAt(0).toUpperCase() + mes.slice(1), media: 0, count: 0 })
      }
      const atual = mapa.get(chave)!
      atual.media += num(item.media)
      atual.count += 1
    })
    return Array.from(mapa.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, v]) => ({
        mes: v.mes,
        media: Number((v.media / Math.max(1, v.count)).toFixed(2)),
      }))
  }, [series])

  // Desempenho por matéria a partir das matérias reais das avaliações.
  // media_percentual (0-100) é convertida para nota (0-10); matéria sem nota = 0.
  const dadosMaterias = React.useMemo(() => {
    const materias = desempenhoAv?.materias ?? []
    return materias.map((m) => ({
      disciplina: m.nome.length > 24 ? `${m.nome.slice(0, 22)}…` : m.nome,
      nota:
        m.media_percentual != null
          ? Number((m.media_percentual / 10).toFixed(2))
          : 0,
    }))
  }, [desempenhoAv])

  const domainMedia = React.useMemo(() => {
    const vals = dadosDesempenhoTempo.map((d) => d.media).filter((v) => v > 0)
    if (vals.length === 0) return [0, 10] as [number, number]
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = Math.max(0.5, (max - min) * 0.1)
    return [Math.max(0, min - pad), Math.min(10, max + pad)] as [number, number]
  }, [dadosDesempenhoTempo])

  const mediaGeral = resumo?.media_geral != null ? Number(resumo.media_geral) : 0
  const taxaAprovacao = React.useMemo(() => {
    if (resumo?.taxa_aprovacao == null) return 0
    const t = Number(resumo.taxa_aprovacao)
    return t <= 1 ? t * 100 : t
  }, [resumo])
  const pendenciasMedia = resumo?.pendentes_correcao ?? 0
  const totalAlunos = resumo?.total_alunos_escopo ?? 0

  const materiasDesempenho: DesempenhoMateriaItem[] = desempenhoAv?.materias ?? []

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
          <p className="mt-1 text-muted-foreground">
            {ehResponsavel && alunoAtivoId
              ? `Desempenho de ${filhos.find((f) => f.id === alunoAtivoId)?.nome ?? "filho selecionado"}`
              : ehProfessor
                ? "Desempenho da turma selecionada no menu lateral"
                : "Analise de desempenho com filtros por escopo e periodo"}
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 rounded-full px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Atualizado agora
        </Badge>
      </div>

      {!ehProfessor && !ehResponsavel && (
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
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
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
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome}
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
      )}

      {(ehProfessor || ehResponsavel) && (
        <Card className="rounded-2xl border-border/50 bg-card/80">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
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
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))
        ) : (
          <>
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
        />
        <CartaoResumo
          titulo="Correcoes pendentes"
          valor={String(pendenciasMedia)}
          descricao="Submissoes aguardando correcao"
          icone={<ClipboardList className="h-6 w-6 text-amber-500" />}
          corIcone="bg-amber-500/10"
        />
        <CartaoResumo
          titulo="Taxa de Aprovacao"
          valor={`${taxaAprovacao.toFixed(0)}%`}
          descricao="Meta acima de 85%"
          icone={<Target className="h-6 w-6 text-violet-500" />}
          corIcone="bg-violet-500/10"
        />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Evolucao do desempenho</CardTitle>
            <CardDescription>Media das notas no periodo selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[320px]">
              {loadingSeries ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosDesempenhoTempo}>
                  <defs>
                    <linearGradient id="gradientChart1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CORES_GRAFICO[0]} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CORES_GRAFICO[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={domainMedia} className="text-xs" tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                  <Area type="monotone" dataKey="media" stroke={CORES_GRAFICO[0]} strokeWidth={2.5} fill="url(#gradientChart1)" name="Media geral" />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Desempenho por materia</CardTitle>
            <CardDescription>Nota media por materia das avaliacoes no periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[320px]">
              {loadingDesempenhoAv ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : dadosMaterias.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhuma materia com avaliacoes no escopo selecionado.
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMaterias} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal vertical={false} />
                  <XAxis type="number" domain={[0, 10]} className="text-xs" tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="disciplina" type="category" className="text-xs" tick={{ fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                  <Bar dataKey="nota" radius={[0, 6, 6, 0]} name="Nota media">
                    {dadosMaterias.map((_, index) => (
                      <Cell key={index} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Desempenho nas avaliacoes</CardTitle>
              <CardDescription>
                Resultados por materia e assunto no periodo selecionado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingDesempenhoAv ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : materiasDesempenho.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliacao concluida no escopo e periodo selecionados.
            </p>
          ) : (
            materiasDesempenho.map((materia) => (
              <Collapsible key={materia.id} defaultOpen className="rounded-xl border border-border/50">
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{materia.nome}</p>
                    {materia.media_percentual != null && (
                      <p className="text-sm text-muted-foreground">
                        Media: {Math.round(materia.media_percentual)}%
                      </p>
                    )}
                  </div>
                  {materia.media_percentual != null && (
                    <div className="hidden w-32 sm:block">
                      <Progress value={materia.media_percentual} className="h-2" />
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 border-t border-border/40 px-4 pb-4 pt-2">
                  {materia.assuntos.map((assunto) => (
                    <div key={assunto.id} className="rounded-lg bg-muted/20 p-3">
                      <p className="text-sm font-medium">{assunto.nome}</p>
                      {assunto.media_percentual != null && (
                        <p className="text-xs text-muted-foreground">
                          Media do assunto: {Math.round(assunto.media_percentual)}%
                        </p>
                      )}
                      <ul className="mt-2 space-y-2">
                        {assunto.avaliacoes.map((av) => (
                          <li
                            key={`${av.id}-${av.aluno_nome ?? ""}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/30 bg-card px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{av.titulo}</span>
                            <div className="flex items-center gap-2">
                              {av.aluno_nome && (
                                <span className="text-xs text-muted-foreground">{av.aluno_nome}</span>
                              )}
                              {av.percentual != null ? (
                                <Badge variant="secondary" className="rounded-full">
                                  {Math.round(av.percentual)}%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-full">
                                  {av.situacao}
                                </Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LabelFiltro({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}
