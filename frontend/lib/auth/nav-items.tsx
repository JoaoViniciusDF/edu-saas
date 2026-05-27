import type { TipoPerfil } from "@/lib/api/dtos/common"
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Megaphone,
  Settings,
  Shield,
} from "lucide-react"
import type { ReactNode } from "react"

export interface ItemNav {
  id: string
  nome: string
  href: string
  icone: ReactNode
}

const NAV_CONTEUDO: ItemNav = {
  id: "conteudo",
  nome: "Conteúdo",
  href: "/conteudo",
  icone: null,
}
const NAV_AVALIACOES: ItemNav = {
  id: "avaliacoes",
  nome: "Avaliações",
  href: "/avaliacoes",
  icone: null,
}
const NAV_COMUNICADOS: ItemNav = {
  id: "comunicados",
  nome: "Comunicados",
  href: "/comunicados",
  icone: null,
}
const NAV_DASHBOARD: ItemNav = {
  id: "dashboard",
  nome: "Dashboard",
  href: "/dashboard",
  icone: null,
}
const NAV_CONFIG: ItemNav = {
  id: "configuracoes",
  nome: "Configurações",
  href: "/configuracoes",
  icone: null,
}
const NAV_SUPER: ItemNav = {
  id: "super-admin",
  nome: "Super Admin",
  href: "/super-admin",
  icone: null,
}
const NAV_PROVAS: ItemNav = {
  id: "provas",
  nome: "Minhas provas",
  href: "/aluno/provas",
  icone: null,
}

function comIcones(items: Omit<ItemNav, "icone">[]): ItemNav[] {
  const mapa: Record<string, ReactNode> = {
    conteudo: <BookOpen className="h-5 w-5" />,
    avaliacoes: <ClipboardCheck className="h-5 w-5" />,
    comunicados: <Megaphone className="h-5 w-5" />,
    dashboard: <BarChart3 className="h-5 w-5" />,
    configuracoes: <Settings className="h-5 w-5" />,
    "super-admin": <Shield className="h-5 w-5" />,
    provas: <ClipboardCheck className="h-5 w-5" />,
  }
  return items.map((i) => ({ ...i, icone: mapa[i.id] ?? null }))
}

export function navPorPerfil(perfil: TipoPerfil | undefined): ItemNav[] {
  if (!perfil) return comIcones([NAV_DASHBOARD, NAV_CONTEUDO, NAV_AVALIACOES, NAV_COMUNICADOS])

  switch (perfil) {
    case "super_admin":
      return comIcones([NAV_SUPER])
    case "administrador":
      return comIcones([
        NAV_DASHBOARD,
        NAV_CONTEUDO,
        NAV_AVALIACOES,
        NAV_COMUNICADOS,
        NAV_CONFIG,
      ])
    case "professor":
      return comIcones([
        NAV_DASHBOARD,
        NAV_CONTEUDO,
        NAV_AVALIACOES,
        NAV_COMUNICADOS,
        NAV_CONFIG,
      ])
    case "aluno":
      return comIcones([
        { ...NAV_CONTEUDO, href: "/aluno/conteudo" },
        NAV_PROVAS,
        { ...NAV_COMUNICADOS, href: "/aluno/comunicados" },
      ])
    case "responsavel":
      return comIcones([NAV_DASHBOARD, NAV_COMUNICADOS])
    default:
      return comIcones([NAV_DASHBOARD, NAV_CONTEUDO, NAV_AVALIACOES, NAV_COMUNICADOS])
  }
}
