"use client"

import { useQuery } from "@tanstack/react-query"
import { Building2, GraduationCap, UserRound, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { cn } from "@/lib/utils"

const KPI_CONFIG = [
  {
    key: "total_instituicoes" as const,
    label: "Instituições",
    icon: Building2,
    cor: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    key: "total_professores" as const,
    label: "Professores",
    icon: GraduationCap,
    cor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "total_turmas" as const,
    label: "Turmas",
    icon: Users,
    cor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "total_alunos" as const,
    label: "Alunos",
    icon: UserRound,
    cor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
]

export function CartoesKpiPlataforma() {
  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "resumo"],
    queryFn: () => configuracoesRequests.superAdminResumo(),
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CONFIG.map((k) => (
          <Skeleton key={k.key} className="h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((k) => {
        const Icon = k.icon
        return (
          <Card
            key={k.key}
            className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-soft"
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", k.cor)}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{k.label}</p>
              <p
                className="mt-1 text-3xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {data?.[k.key] ?? 0}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
