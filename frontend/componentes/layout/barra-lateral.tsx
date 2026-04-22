"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BookOpen, 
  ClipboardCheck, 
  Megaphone, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ItemNavegacao {
  id: string
  nome: string
  href: string
  icone: React.ReactNode
}

const itensNavegacao: ItemNavegacao[] = [
  { id: "dashboard", nome: "Dashboard", href: "/dashboard", icone: <BarChart3 className="h-5 w-5" /> },
  { id: "conteudo", nome: "Conteúdo", href: "/conteudo", icone: <BookOpen className="h-5 w-5" /> },
  { id: "avaliacoes", nome: "Avaliações", href: "/avaliacoes", icone: <ClipboardCheck className="h-5 w-5" /> },
  { id: "comunicados", nome: "Comunicados", href: "/comunicados", icone: <Megaphone className="h-5 w-5" /> },
]

function caminhoAtivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function ConteudoNavegacao({ 
  pathname,
  recolhido = false,
  aoFechar
}: { pathname: string; recolhido?: boolean; aoFechar?: () => void }) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-20 items-center px-5",
          recolhido ? "justify-center" : "gap-3"
        )}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-soft">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {!recolhido && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                EduSaaS
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Plataforma Educacional
              </span>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1.5">
            {itensNavegacao.map((item) => {
              const ativo = caminhoAtivo(pathname, item.href)
              const botao = (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200",
                    ativo 
                      ? "bg-primary text-primary-foreground shadow-soft" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    recolhido && "justify-center px-3"
                  )}
                  onClick={() => aoFechar?.()}
                >
                  <span className={cn(
                    "transition-transform duration-200",
                    ativo && "scale-110"
                  )}>
                    {item.icone}
                  </span>
                  {!recolhido && <span>{item.nome}</span>}
                </Link>
              )

              if (recolhido) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{botao}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      <p>{item.nome}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return botao
            })}
          </div>
        </nav>

        {/* Footer */}
        {!recolhido && (
          <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent">
            <p className="text-xs font-medium text-foreground mb-1">Dica do dia</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use o Dashboard para acompanhar o desempenho dos seus alunos em tempo real.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export function BarraLateral() {
  const pathname = usePathname()
  const [recolhido, setRecolhido] = React.useState(false)
  const [sheetAberto, setSheetAberto] = React.useState(false)

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center glass border-b border-border/50">
        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <ConteudoNavegacao 
              pathname={pathname}
              aoFechar={() => setSheetAberto(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>EduSaaS</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex relative h-screen flex-col border-r border-border/50 bg-card transition-all duration-300 ease-out",
          recolhido ? "w-20" : "w-72"
        )}
      >
        <ConteudoNavegacao 
          pathname={pathname}
          recolhido={recolhido}
        />

        {/* Botão de recolher */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-3.5 top-7 h-7 w-7 rounded-full border border-border shadow-soft hover:shadow-soft-lg transition-all z-50"
          onClick={() => setRecolhido(!recolhido)}
        >
          {recolhido ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
      </aside>
    </>
  )
}
