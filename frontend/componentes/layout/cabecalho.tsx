"use client"

import * as React from "react"
import { Bell, Check, Circle, Command, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlternadorTema } from "@/componentes/alternador-tema"
import { FaixaImpersonacao } from "@/componentes/layout/faixa-impersonacao"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import type { NotificacaoItem } from "@/lib/api/dtos/dashboard"
import type { SearchHit } from "@/lib/api/dtos/dashboard"
import { dashboardRequests } from "@/lib/api/requests/dashboard"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const LABEL_PERFIL: Record<string, string> = {
  super_admin: "Super Admin",
  administrador: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
  responsavel: "Responsável",
}

export function Cabecalho() {
  const { usuario, logout } = useAuth()
  const router = useRouter()
  const [notificacoes, setNotificacoes] = React.useState<NotificacaoItem[]>([])
  const [busca, setBusca] = React.useState("")
  const [resultadosBusca, setResultadosBusca] = React.useState<SearchHit[]>([])
  const [buscaAberta, setBuscaAberta] = React.useState(false)
  const [painelAberto, setPainelAberto] = React.useState(false)
  const [larguraPainel, setLarguraPainel] = React.useState(420)
  const [arrastandoResize, setArrastandoResize] = React.useState(false)

  const naoLidas = notificacoes.filter((item) => !item.lida_flag).length
  const iniciais = usuario?.nome_exibicao
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?"

  React.useEffect(() => {
    dashboardRequests
      .notificacoes()
      .then(setNotificacoes)
      .catch(() => setNotificacoes([]))
  }, [])

  React.useEffect(() => {
    if (busca.trim().length < 2) {
      setResultadosBusca([])
      return
    }
    const t = setTimeout(() => {
      dashboardRequests
        .search(busca.trim())
        .then(setResultadosBusca)
        .catch(() => setResultadosBusca([]))
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  React.useEffect(() => {
    if (!arrastandoResize) return

    const mover = (event: MouseEvent) => {
      const larguraCalculada = window.innerWidth - event.clientX
      const larguraLimitada = Math.max(320, Math.min(760, larguraCalculada))
      setLarguraPainel(larguraLimitada)
    }

    const parar = () => setArrastandoResize(false)

    window.addEventListener("mousemove", mover)
    window.addEventListener("mouseup", parar)
    return () => {
      window.removeEventListener("mousemove", mover)
      window.removeEventListener("mouseup", parar)
    }
  }, [arrastandoResize])

  const marcarComoLida = async (notificacaoId: string) => {
    await dashboardRequests.marcarNotificacaoLida(notificacaoId)
    setNotificacoes((prev) =>
      prev.map((item) =>
        item.id === notificacaoId ? { ...item, lida_flag: true } : item
      )
    )
  }

  const marcarTodasComoLidas = async () => {
    await dashboardRequests.marcarTodasLidas()
    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida_flag: true })))
  }

  return (
    <>
      <FaixaImpersonacao />
      <header className="relative z-0 hidden h-20 items-center justify-between border-b border-border/50 bg-card/50 px-8 backdrop-blur-xl lg:flex">
        <div className="flex max-w-xl flex-1 items-center">
          <div className="group relative w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              type="search"
              placeholder="Buscar conteúdos, avaliações, alunos..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setBuscaAberta(true)
              }}
              onFocus={() => setBuscaAberta(true)}
              onBlur={() => setTimeout(() => setBuscaAberta(false), 200)}
              className="h-12 w-full rounded-xl border-transparent bg-secondary/50 pl-11 pr-20 text-sm placeholder:text-muted-foreground/70 transition-all focus:border-primary/30 focus:bg-card focus:shadow-soft"
            />
            {buscaAberta && resultadosBusca.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-card p-2 shadow-soft-lg">
                {resultadosBusca.map((hit) => (
                  <button
                    key={`${hit.tipo}-${hit.id}`}
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                    onMouseDown={() => {
                      if (hit.url_deep_link) router.push(hit.url_deep_link)
                    }}
                  >
                    <p className="font-medium">{hit.titulo}</p>
                    {hit.subtitulo && (
                      <p className="text-xs text-muted-foreground">{hit.subtitulo}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-7 -translate-y-1/2 select-none items-center gap-1 rounded-lg border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 rounded-xl transition-colors hover:bg-secondary"
            onClick={() => setPainelAberto(true)}
          >
            <Bell className="h-5 w-5" />
            {naoLidas > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />}
            <span className="sr-only">Notificações</span>
          </Button>

          <AlternadorTema />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 gap-3 rounded-xl pl-2 pr-4 transition-colors hover:bg-secondary">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground">
                    {iniciais}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-semibold">{usuario?.nome_exibicao ?? "Usuário"}</span>
                  <span className="text-xs text-muted-foreground">
                    {usuario ? LABEL_PERFIL[usuario.perfil] ?? usuario.perfil : ""}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl shadow-soft-lg" align="end">
              <DropdownMenuLabel className="p-4 font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{usuario?.nome_exibicao}</p>
                  <p className="text-xs leading-none text-muted-foreground">{usuario?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="mx-2 cursor-pointer rounded-lg px-4 py-2.5">Meu Perfil</DropdownMenuItem>
              <DropdownMenuItem className="mx-2 cursor-pointer rounded-lg px-4 py-2.5">Configurações</DropdownMenuItem>
              <DropdownMenuItem className="mx-2 cursor-pointer rounded-lg px-4 py-2.5">Ajuda e Suporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="mx-2 cursor-pointer rounded-lg px-4 py-2.5 text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-black/35 transition-opacity duration-300",
          painelAberto ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setPainelAberto(false)}
        aria-label="Fechar painel de comunicados"
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen max-w-[90vw] flex-col border-l border-border/60 bg-card shadow-soft-lg transition-transform duration-300",
          painelAberto ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: larguraPainel }}
      >
        <button
          type="button"
          className="absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-col-resize"
          onMouseDown={() => setArrastandoResize(true)}
          aria-label="Redimensionar painel de comunicados"
        >
          <span className="mx-auto block h-16 w-1 rounded-full bg-border/80" />
        </button>

        <div className="border-b border-border/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold">Comunicados</h4>
              <p className="text-xs text-muted-foreground">
                {naoLidas > 0 ? `${naoLidas} não lidas` : "Tudo em dia"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={marcarTodasComoLidas}>
                Marcar todas
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setPainelAberto(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {notificacoes.map((notif) => (
              <button
                key={notif.id}
                onClick={() => marcarComoLida(notif.id)}
                className={cn(
                  "mb-1 w-full rounded-xl border p-4 text-left transition-colors",
                  notif.lida_flag ? "border-transparent hover:bg-secondary/80" : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                )}
              >
                <div className="flex items-start gap-3">
                  {notif.lida_flag ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 fill-primary text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", !notif.lida_flag && "font-semibold")}>{notif.titulo}</p>
                      <Badge variant={notif.lida_flag ? "outline" : "secondary"} className="rounded-full text-[10px]">
                        {notif.lida_flag ? "Visto" : "Nao visto"}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{notif.corpo_curto}</p>
                    {notif.criado_em && (
                      <p className="mt-1.5 text-xs text-muted-foreground/70">{notif.criado_em}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
