"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TipoPerfilUsuario, UsuarioDetalheResponse, UsuarioSuperAdminPatch } from "@/lib/api/dtos/configuracoes"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: UsuarioDetalheResponse
  onSalvar: (body: UsuarioSuperAdminPatch) => Promise<void>
  salvando: boolean
}

export function ModalEditarUsuario({ open, onOpenChange, data, onSalvar, salvando }: Props) {
  const [nome, setNome] = React.useState(data.nome_exibicao)
  const [email, setEmail] = React.useState(data.email)
  const [senha, setSenha] = React.useState("")
  const [matricula, setMatricula] = React.useState(data.matricula_codigo ?? "")
  const [registro, setRegistro] = React.useState(data.registro_funcional ?? "")
  const [areas, setAreas] = React.useState(data.areas_especialidade ?? "")
  const [parentesco, setParentesco] = React.useState(data.grau_parentesco ?? "")
  const [telefone, setTelefone] = React.useState(data.telefone ?? "")

  React.useEffect(() => {
    if (open) {
      setNome(data.nome_exibicao)
      setEmail(data.email)
      setSenha("")
      setMatricula(data.matricula_codigo ?? "")
      setRegistro(data.registro_funcional ?? "")
      setAreas(data.areas_especialidade ?? "")
      setParentesco(data.grau_parentesco ?? "")
      setTelefone(data.telefone ?? "")
    }
  }, [open, data])

  const submit = async () => {
    const body: UsuarioSuperAdminPatch = {
      nome_exibicao: nome,
      email,
    }
    if (senha.trim()) body.senha = senha
    if (data.tipo_perfil === "aluno") {
      body.matricula_codigo = matricula || null
    }
    if (data.tipo_perfil === "professor") {
      body.registro_funcional = registro || null
      body.areas_especialidade = areas || null
    }
    if (data.tipo_perfil === "responsavel") {
      body.grau_parentesco = parentesco || null
      body.telefone = telefone || null
    }
    await onSalvar(body)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nova senha (opcional)</Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Deixe em branco para manter"
            />
          </div>
          {data.tipo_perfil === "aluno" && (
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input value={matricula} onChange={(e) => setMatricula(e.target.value)} />
            </div>
          )}
          {data.tipo_perfil === "professor" && (
            <>
              <div className="space-y-2">
                <Label>Registro funcional</Label>
                <Input value={registro} onChange={(e) => setRegistro(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Áreas de especialidade</Label>
                <Input value={areas} onChange={(e) => setAreas(e.target.value)} />
              </div>
            </>
          )}
          {data.tipo_perfil === "responsavel" && (
            <>
              <div className="space-y-2">
                <Label>Grau de parentesco</Label>
                <Input value={parentesco} onChange={(e) => setParentesco(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={salvando} onClick={() => void submit()}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
