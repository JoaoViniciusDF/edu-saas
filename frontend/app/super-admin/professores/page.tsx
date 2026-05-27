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

export default function ProfessoresSuperAdminPage() {
  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["super-admin", "professores"],
    queryFn: () => adminRequests.superAdminProfessores(),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Professores (plataforma)</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Instituição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.nome_exibicao}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.instituicao_nome ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
