"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { adminRequests } from "@/lib/api/requests/configuracoes"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function InstituicoesSuperAdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "instituicoes"],
    queryFn: () => adminRequests.listInstituicoes(),
  })

  const itens = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Instituições</h1>
        <Button asChild className="rounded-xl">
          <Link href="/super-admin/instituicoes/nova">Nova</Link>
        </Button>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.nome_fantasia}</TableCell>
                <TableCell>{i.documento_legal ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
