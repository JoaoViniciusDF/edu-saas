"use client"

import { useQuery } from "@tanstack/react-query"
import { adminRequests } from "@/lib/api/requests/configuracoes"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function TurmasSuperAdminPage() {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["super-admin", "turmas"],
    queryFn: () => adminRequests.superAdminTurmas(),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Turmas (plataforma)</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Ano</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.nome}</TableCell>
                <TableCell>{t.ano_letivo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
