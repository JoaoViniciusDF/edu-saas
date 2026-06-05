"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { ModalWizardShell } from "@/components/ui/modal-wizard-shell"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { mensagemErroApi } from "@/lib/formatacao/mascaras"
import {
  PassoConfirmarUsuario,
  PassoDadosUsuario,
  useFormularioCriarUsuario,
} from "./wizard-criar-usuario-passos"

const ETAPAS = ["Dados", "Confirmar"] as const

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function ModalCriarSuperAdminWizard({ aberto, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [etapa, setEtapa] = React.useState(0)
  const [salvando, setSalvando] = React.useState(false)
  const form = useFormularioCriarUsuario("super_admin")

  const passoAtual = ETAPAS[etapa] ?? ETAPAS[0]

  const reset = () => {
    setEtapa(0)
    form.reset()
  }

  const podeAvancar = () => {
    if (passoAtual === "Dados") return form.dadosValidos
    return true
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      await configuracoesRequests.createUsuario({
        tipo_perfil: "super_admin",
        nome_exibicao: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
      })
      toast.success("Super admin criado com sucesso!")
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.resumo() })
      void qc.invalidateQueries({ queryKey: ["super-admin", "diretorio"] })
      reset()
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error(mensagemErroApi(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Novo super admin"
      etapas={[...ETAPAS]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={podeAvancar()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Criar super admin"
      icone={Sparkles}
      onReset={reset}
    >
      {passoAtual === "Dados" && (
        <PassoDadosUsuario
          perfil="super_admin"
          nome={form.nome}
          setNome={form.setNome}
          email={form.email}
          setEmail={form.setEmail}
          senha={form.senha}
          setSenha={form.setSenha}
          matricula={form.matricula}
          setMatricula={form.setMatricula}
          registro={form.registro}
          setRegistro={form.setRegistro}
          grauParentesco={form.grauParentesco}
          setGrauParentesco={form.setGrauParentesco}
          telefone={form.telefone}
          setTelefone={form.setTelefone}
        />
      )}
      {passoAtual === "Confirmar" && (
        <PassoConfirmarUsuario
          perfil="super_admin"
          nome={form.nome}
          email={form.email}
          matricula={form.matricula}
          registro={form.registro}
        />
      )}
    </ModalWizardShell>
  )
}
