"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { authRequests } from "@/lib/api/requests/configuracoes"

const LABEL_PERFIL: Record<string, string> = {
  super_admin: "Super Admin",
  administrador: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
  responsavel: "Responsável",
}

export function FaixaImpersonacao() {
  const { usuario, recarregar } = useAuth()
  const router = useRouter()

  if (!usuario?.impersonador) return null

  const voltar = async () => {
    await authRequests.restaurarSessaoAdmin()
    await recarregar()
    const instId = sessionStorage.getItem("edu_impersonacao_instituicao_id")
    router.push(instId ? `/super-admin/instituicoes/${instId}` : "/super-admin")
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
      <p>
        Visualizando como{" "}
        <span className="font-semibold">{usuario.nome_exibicao}</span>{" "}
        <span className="text-muted-foreground">
          ({LABEL_PERFIL[usuario.perfil] ?? usuario.perfil})
        </span>
      </p>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 rounded-xl gap-2 border-amber-500/40"
        onClick={() => void voltar()}
      >
        <LogOut className="h-4 w-4" />
        Voltar ao Super Admin
      </Button>
    </div>
  )
}
