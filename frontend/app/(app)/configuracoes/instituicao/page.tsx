"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { leituraRequests } from "@/lib/api/requests/configuracoes"

export default function InstituicaoConfigPage() {
  const { usuario } = useAuth()
  const qc = useQueryClient()
  const instId = usuario?.instituicao_id

  const { data: inst, isLoading } = useQuery({
    queryKey: ["instituicao", instId],
    queryFn: () => leituraRequests.getInstituicao(instId!),
    enabled: Boolean(instId),
  })

  const [nome, setNome] = React.useState("")
  const [documento, setDocumento] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (inst) {
      setNome(inst.nome_fantasia)
      setDocumento(inst.documento_legal ?? "")
    }
  }, [inst])

  if (!instId) {
    return <p className="text-muted-foreground">Instituição não vinculada a este perfil.</p>
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>

  const salvar = async () => {
    setErro(null)
    setSalvando(true)
    try {
      await leituraRequests.patchInstituicao(instId, {
        nome_fantasia: nome,
        documento_legal: documento || null,
      })
      void qc.invalidateQueries({ queryKey: ["instituicao", instId] })
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Minha instituição</h2>
        <p className="text-sm text-muted-foreground">Dados cadastrais da escola</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome fantasia</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc">Documento legal (CNPJ)</Label>
          <Input id="doc" value={documento} onChange={(e) => setDocumento(e.target.value)} />
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button onClick={() => void salvar()} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  )
}
