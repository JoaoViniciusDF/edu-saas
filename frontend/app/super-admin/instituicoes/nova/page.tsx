"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminRequests } from "@/lib/api/requests/configuracoes"

export default function NovaInstituicaoPage() {
  const router = useRouter()
  const [nome, setNome] = React.useState("")
  const [adminEmail, setAdminEmail] = React.useState("")
  const [adminSenha, setAdminSenha] = React.useState("Demo@2026")
  const [adminNome, setAdminNome] = React.useState("")
  const [erro, setErro] = React.useState<string | null>(null)

  const salvar = async () => {
    setErro(null)
    try {
      await adminRequests.createInstituicao({
        nome_fantasia: nome,
        administrador_inicial: adminEmail
          ? {
              email: adminEmail,
              senha: adminSenha,
              nome_exibicao: adminNome || "Administrador",
            }
          : undefined,
      })
      router.push("/super-admin/instituicoes")
    } catch (e: unknown) {
      setErro((e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Nova instituição</h1>
      <div className="space-y-2">
        <Label>Nome fantasia</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>E-mail do administrador (opcional)</Label>
        <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Nome do administrador</Label>
        <Input value={adminNome} onChange={(e) => setAdminNome(e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Senha inicial</Label>
        <Input
          type="password"
          value={adminSenha}
          onChange={(e) => setAdminSenha(e.target.value)}
          className="rounded-xl"
        />
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Button className="rounded-xl" onClick={() => void salvar()}>
        Criar instituição
      </Button>
    </div>
  )
}
