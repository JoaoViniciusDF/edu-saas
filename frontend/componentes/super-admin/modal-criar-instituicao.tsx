"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Building2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
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
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import {
  emailValido,
  gerarSenhaAleatoria,
  mascaraDocumentoLegal,
  mensagemErroApi,
} from "@/lib/formatacao/mascaras"

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function ModalCriarInstituicao({ aberto, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [nome, setNome] = React.useState("")
  const [documento, setDocumento] = React.useState("")
  const [adminEmail, setAdminEmail] = React.useState("")
  const [adminNome, setAdminNome] = React.useState("")
  const [adminSenha, setAdminSenha] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  const reset = () => {
    setNome("")
    setDocumento("")
    setAdminEmail("")
    setAdminNome("")
    setAdminSenha("")
  }

  const blocoAdminPreenchido =
    adminEmail.trim() || adminNome.trim() || adminSenha.trim()

  const salvar = async () => {
    if (!nome.trim()) return
    if (blocoAdminPreenchido) {
      if (!emailValido(adminEmail)) {
        toast.error("Informe um e-mail válido para o administrador inicial")
        return
      }
      if (adminSenha.trim().length < 6) {
        toast.error("A senha do administrador deve ter pelo menos 6 caracteres")
        return
      }
    }
    setSalvando(true)
    try {
      await configuracoesRequests.createInstituicao({
        nome_fantasia: nome.trim(),
        documento_legal: documento.trim() || undefined,
        administrador_inicial: adminEmail.trim()
          ? {
              email: adminEmail.trim().toLowerCase(),
              senha: adminSenha,
              nome_exibicao: adminNome.trim() || "Administrador",
            }
          : undefined,
      })
      toast.success("Instituição criada com sucesso!")
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.resumo() })
      void qc.invalidateQueries({ queryKey: ["super-admin", "diretorio"] })
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.instituicoes() })
      reset()
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error(mensagemErroApi(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-soft">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Nova instituição</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome fantasia *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Documento legal</Label>
            <Input
              value={documento}
              onChange={(e) => setDocumento(mascaraDocumentoLegal(e.target.value))}
              className="rounded-xl"
              placeholder="CPF ou CNPJ"
              inputMode="numeric"
            />
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Administrador inicial (opcional)</p>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="rounded-xl"
                type="email"
                autoComplete="email"
                placeholder="admin@escola.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={adminNome} onChange={(e) => setAdminNome(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Senha inicial</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-lg text-xs"
                  onClick={() => setAdminSenha(gerarSenhaAleatoria())}
                >
                  <RefreshCw className="h-3 w-3" />
                  Gerar senha
                </Button>
              </div>
              <Input
                type="password"
                value={adminSenha}
                onChange={(e) => setAdminSenha(e.target.value)}
                className="rounded-xl"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-br from-primary to-primary/80"
            disabled={salvando || !nome.trim()}
            onClick={() => void salvar()}
          >
            {salvando ? "Criando..." : "Criar instituição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
