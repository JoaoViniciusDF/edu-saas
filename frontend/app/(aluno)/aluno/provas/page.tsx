"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { alunoAvaliacoesRequests } from "@/lib/api/requests/avaliacoes"

export default function AlunoProvasPage() {
  const { data: provas = [], isLoading } = useQuery({
    queryKey: ["aluno", "provas"],
    queryFn: () => alunoAvaliacoesRequests.disponiveis(),
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Carregando provas...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Minhas provas
      </h1>
      {provas.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma prova disponível no momento.</p>
      ) : (
        provas.map((p) => (
          <Link key={p.id} href={`/aluno/provas/${p.id}`}>
            <Card className="rounded-2xl transition-shadow hover:shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{p.titulo}</CardTitle>
                {p.status_submissao && (
                  <Badge variant="secondary" className="rounded-full">
                    {p.status_submissao}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {p.prazo_utc && (
                  <p className="text-sm text-muted-foreground">
                    Prazo: {new Date(p.prazo_utc).toLocaleString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  )
}
