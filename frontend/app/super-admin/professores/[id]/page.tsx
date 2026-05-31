"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, GraduationCap, Hash, LogIn, Mail } from "lucide-react"
import { BadgePerfil } from "@/componentes/super-admin/badge-perfil"
import { BreadcrumbSuperAdmin } from "@/componentes/super-admin/breadcrumb-super-admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authRequests, configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { ROTA_HOME_POR_PERFIL } from "@/lib/auth/rotas-por-perfil"
import { useAuth } from "@/componentes/provedores/provedor-auth"

function CampoInfo({
  icone: Icon,
  label,
  valor,
}: {
  icone: React.ElementType
  label: string
  valor: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{valor}</p>
      </div>
    </div>
  )
}

export default function ProfessorDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { recarregar } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "professor", id],
    queryFn: () => configuracoesRequests.getDetalheProfessor(id),
  })

  const entrarComo = async () => {
    if (!data) return
    if (data.instituicao?.id) {
      sessionStorage.setItem("edu_impersonacao_instituicao_id", data.instituicao.id)
    }
    await authRequests.assumirSessao(data.usuario_id)
    await recarregar()
    router.push(ROTA_HOME_POR_PERFIL.professor)
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const crumbs = [
    ...(data.instituicao
      ? [{ label: data.instituicao.nome_fantasia, href: `/super-admin/instituicoes/${data.instituicao.id}` }]
      : []),
    { label: data.nome_exibicao },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BreadcrumbSuperAdmin items={crumbs} />
        <Button
          className="rounded-xl gap-2 bg-gradient-to-br from-primary to-primary/80"
          onClick={() => void entrarComo()}
        >
          <LogIn className="h-4 w-4" />
          Entrar como
        </Button>
      </div>

      <div className="border-l-4 border-blue-500/40 pl-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {data.nome_exibicao}
          </h1>
          <BadgePerfil perfil="professor" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoInfo icone={Mail} label="E-mail" valor={data.email} />
        <CampoInfo icone={Hash} label="Registro funcional" valor={data.registro_funcional ?? "—"} />
        <CampoInfo
          icone={BookOpen}
          label="Áreas de especialidade"
          valor={data.areas_especialidade ?? "—"}
        />
        <CampoInfo
          icone={GraduationCap}
          label="Instituição"
          valor={data.instituicao?.nome_fantasia ?? "—"}
        />
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Turmas titulares</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {data.turmas_titulares.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">Nenhuma turma como titular.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ano letivo</TableHead>
                  <TableHead>Turno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.turmas_titulares.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.nome}</TableCell>
                    <TableCell>{t.ano_letivo}</TableCell>
                    <TableCell>{t.turno ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
