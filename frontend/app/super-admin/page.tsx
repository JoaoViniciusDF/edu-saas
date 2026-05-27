"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminRequests } from "@/lib/api/requests/configuracoes"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SuperAdminHomePage() {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["super-admin", "resumo"],
    queryFn: () => adminRequests.superAdminResumo(),
  })

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>

  const cards = [
    { label: "Instituições", valor: resumo?.total_instituicoes ?? 0 },
    { label: "Professores", valor: resumo?.total_professores ?? 0 },
    { label: "Turmas", valor: resumo?.total_turmas ?? 0 },
    { label: "Alunos", valor: resumo?.total_alunos ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel da plataforma</h1>
        <Button asChild className="rounded-xl">
          <Link href="/super-admin/instituicoes/nova">Nova instituição</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
