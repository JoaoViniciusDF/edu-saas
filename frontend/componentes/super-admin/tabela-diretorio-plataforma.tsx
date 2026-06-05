"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BadgePerfil } from "@/componentes/super-admin/badge-perfil"
import type { FiltrosDiretorioState } from "@/componentes/super-admin/filtros-diretorio"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { DiretorioPlataformaItem, VisaoPlataforma } from "@/lib/api/dtos/configuracoes"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

function colunasVisao(visao: VisaoPlataforma): { key: string; header: string }[] {
  switch (visao) {
    case "instituicoes":
      return [
        { key: "nome", header: "Nome" },
        { key: "documento", header: "Documento" },
        { key: "prof", header: "Professores" },
        { key: "turmas", header: "Turmas" },
        { key: "alunos", header: "Alunos" },
      ]
    case "professores":
      return [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "inst", header: "Instituição" },
        { key: "registro", header: "Registro" },
      ]
    case "alunos":
      return [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "inst", header: "Instituição" },
        { key: "matricula", header: "Matrícula" },
      ]
    case "turmas":
      return [
        { key: "nome", header: "Nome" },
        { key: "ano", header: "Ano" },
        { key: "turno", header: "Turno" },
        { key: "inst", header: "Instituição" },
        { key: "prof", header: "Professor titular" },
        { key: "alunos", header: "Alunos" },
      ]
    case "alunos_turma":
      return [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "turmas", header: "Turma(s)" },
        { key: "matricula", header: "Matrícula" },
      ]
    case "professores_turma":
      return [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "turmas", header: "Turma(s) titular" },
      ]
    case "usuarios":
      return [
        { key: "nome", header: "Nome" },
        { key: "email", header: "E-mail" },
        { key: "perfil", header: "Perfil" },
        { key: "inst", header: "Instituição" },
      ]
    default:
      return [{ key: "nome", header: "Nome" }]
  }
}

function renderCelula(item: DiretorioPlataformaItem, key: string) {
  switch (key) {
    case "nome":
      return item.nome
    case "documento":
      return item.documento_legal ?? "—"
    case "email":
      return item.email ?? "—"
    case "inst":
      return item.instituicao_nome ?? "—"
    case "registro":
      return item.registro_funcional ?? "—"
    case "matricula":
      return item.matricula_codigo ?? "—"
    case "ano":
      return item.ano_letivo ?? "—"
    case "turno":
      return item.turno ?? "—"
    case "prof":
      return item.contagem_professores ?? item.professor_titular_nome ?? "—"
    case "turmas":
      if (item.contagem_turmas != null) return item.contagem_turmas
      return item.turmas?.map((t) => t.nome).join(", ") ?? "—"
    case "alunos":
      return item.contagem_alunos ?? "—"
    case "perfil":
      return item.perfil ? <BadgePerfil perfil={item.perfil} /> : "—"
    default:
      return "—"
  }
}

function rotaItem(item: DiretorioPlataformaItem, visao: VisaoPlataforma): string | null {
  if (visao === "instituicoes" || item.tipo === "instituicao") {
    return `/super-admin/instituicoes/${item.id}`
  }
  const usuarioId = item.usuario_id ?? (item.tipo === "usuario" ? item.id : null)
  if (usuarioId) {
    return `/super-admin/usuario/${usuarioId}`
  }
  if (visao === "alunos" || visao === "alunos_turma") {
    return item.usuario_id ? `/super-admin/usuario/${item.usuario_id}` : null
  }
  if (visao === "professores" || visao === "professores_turma") {
    return item.usuario_id ? `/super-admin/usuario/${item.usuario_id}` : null
  }
  return null
}

interface Props {
  filtros: FiltrosDiretorioState
  queryKeyPrefix?: string
  onRowClick?: (item: DiretorioPlataformaItem) => void
  renderAcoes?: (item: DiretorioPlataformaItem) => React.ReactNode
}

export function TabelaDiretorioPlataforma({ filtros, queryKeyPrefix = "super-admin", onRowClick, renderAcoes }: Props) {
  const router = useRouter()
  const [pagina, setPagina] = React.useState(0)

  React.useEffect(() => {
    setPagina(0)
  }, [filtros.visao, filtros.instituicaoId, filtros.turmaIds, filtros.perfil, filtros.busca])

  const precisaTurma =
    (filtros.visao === "alunos_turma" || filtros.visao === "professores_turma") &&
    filtros.turmaIds.length === 0

  const { data, isLoading } = useQuery({
    queryKey: [
      queryKeyPrefix,
      "diretorio",
      filtros.visao,
      filtros.instituicaoId,
      filtros.turmaIds,
      filtros.perfil,
      filtros.busca,
      pagina,
    ],
    queryFn: () =>
      configuracoesRequests.consultarDiretorioPlataforma({
        visao: filtros.visao,
        instituicao_id: filtros.instituicaoId || undefined,
        turma_ids: filtros.turmaIds.length ? filtros.turmaIds : undefined,
        perfil: filtros.perfil || undefined,
        busca: filtros.busca || undefined,
        limit: PAGE_SIZE,
        offset: pagina * PAGE_SIZE,
      }),
    enabled: !precisaTurma,
  })

  const colunas = colunasVisao(filtros.visao)
  const colunasComAcoes = renderAcoes ? [...colunas, { key: "acoes", header: "Ações" }] : colunas
  const total = data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleClick = (item: DiretorioPlataformaItem) => {
    if (onRowClick) {
      onRowClick(item)
      return
    }
    const rota = rotaItem(item, filtros.visao)
    if (rota) router.push(rota)
  }

  if (precisaTurma) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border/50">
        <EmptyHeader>
          <EmptyTitle>Selecione uma ou mais turmas</EmptyTitle>
          <EmptyDescription>
            Use o filtro de turmas para visualizar alunos ou professores por turma.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {colunasComAcoes.map((c) => (
                <TableHead key={c.key} className="font-semibold">
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {colunasComAcoes.map((c) => (
                    <TableCell key={c.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={colunasComAcoes.length} className="h-32 text-center">
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>Nenhum resultado</EmptyTitle>
                      <EmptyDescription>Ajuste os filtros para encontrar registros.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => {
                const clicavel = !!rotaItem(item, filtros.visao) || !!onRowClick
                return (
                  <TableRow
                    key={`${item.tipo}-${item.id}`}
                    className={cn(clicavel && "cursor-pointer hover:bg-primary/5")}
                    onClick={() => clicavel && handleClick(item)}
                  >
                    {colunas.map((c) => (
                      <TableCell key={c.key}>{renderCelula(item, c.key)}</TableCell>
                    ))}
                    {renderAcoes && (
                      <TableCell onClick={(e) => e.stopPropagation()}>{renderAcoes(item)}</TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {pagina * PAGE_SIZE + 1}–{Math.min((pagina + 1) * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={pagina === 0}
              onClick={() => setPagina((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={pagina >= totalPaginas - 1}
              onClick={() => setPagina((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
