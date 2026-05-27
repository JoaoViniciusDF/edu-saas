"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/componentes/provedores/provedor-auth"

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { usuario, carregando } = useAuth()

  React.useEffect(() => {
    if (carregando || !usuario) return
    if (usuario.perfil === "professor") {
      router.replace("/configuracoes/turmas")
      return
    }
    if (usuario.perfil === "administrador") {
      router.replace("/configuracoes/instituicao")
      return
    }
    router.replace("/dashboard")
  }, [usuario, carregando, router])

  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      Redirecionando...
    </div>
  )
}
