"use client"

import * as React from "react"
import { Pencil, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TipoCadastroWizard } from "@/componentes/configuracoes/wizards/modal-criar-cadastro-wizard"
import { ModalCriarCadastroWizard } from "@/componentes/configuracoes/wizards/modal-criar-cadastro-wizard"
import { ModalEditarCadastroWizard } from "@/componentes/configuracoes/wizards/modal-editar-cadastro-wizard"
import { ModalGerenciarTurmaApp } from "@/componentes/configuracoes/modal-gerenciar-turma-app"
import type { TurmaListItem } from "@/lib/api/dtos/configuracoes"

type Coluna<T> = {
  key: string
  header: string
  render: (item: T) => React.ReactNode
}

type ListaCadastroProps<T extends { id: string }> = {
  titulo: string
  itens: T[]
  colunas: Coluna<T>[]
  carregando?: boolean
  tipoWizard?: TipoCadastroWizard
  ocultarCriar?: boolean
  mostrarGerenciarTurma?: boolean
}

export function ListaCadastro<T extends { id: string }>({
  titulo,
  itens,
  colunas,
  carregando,
  tipoWizard,
  ocultarCriar,
  mostrarGerenciarTurma,
}: ListaCadastroProps<T>) {
  const [criarAberto, setCriarAberto] = React.useState(false)
  const [editarAberto, setEditarAberto] = React.useState(false)
  const [itemEditando, setItemEditando] = React.useState<T | null>(null)
  const [turmaGerenciar, setTurmaGerenciar] = React.useState<TurmaListItem | null>(null)

  if (carregando) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {!ocultarCriar && tipoWizard && (
          <Button className="rounded-xl gap-2" onClick={() => setCriarAberto(true)}>
            Novo cadastro
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {colunas.map((c) => (
              <TableHead key={c.key}>{c.header}</TableHead>
            ))}
            {tipoWizard && <TableHead className="w-[140px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id}>
              {colunas.map((c) => (
                <TableCell key={c.key}>{c.render(item)}</TableCell>
              ))}
              {tipoWizard && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => {
                        setItemEditando(item)
                        setEditarAberto(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {mostrarGerenciarTurma && tipoWizard === "turma" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => setTurmaGerenciar(item as unknown as TurmaListItem)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tipoWizard && (
        <>
          <ModalCriarCadastroWizard
            tipo={tipoWizard}
            aberto={criarAberto}
            onOpenChange={setCriarAberto}
          />
          <ModalEditarCadastroWizard
            tipo={tipoWizard}
            item={itemEditando}
            aberto={editarAberto}
            onOpenChange={(v) => {
              setEditarAberto(v)
              if (!v) setItemEditando(null)
            }}
          />
        </>
      )}

      {turmaGerenciar && (
        <ModalGerenciarTurmaApp
          open={!!turmaGerenciar}
          onOpenChange={(v) => !v && setTurmaGerenciar(null)}
          turma={turmaGerenciar}
        />
      )}
    </div>
  )
}
