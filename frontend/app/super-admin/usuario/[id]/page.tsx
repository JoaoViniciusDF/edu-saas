"use client"

import { useParams } from "next/navigation"
import { DetalheUsuarioView } from "@/componentes/super-admin/usuario/detalhe-usuario-view"

export default function UsuarioDetalhePage() {
  const params = useParams()
  const id = params.id as string
  return <DetalheUsuarioView usuarioId={id} />
}
