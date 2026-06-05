"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookMarked,
  GraduationCap,
  HeartHandshake,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ModalWizardShell,
  WizardCardOption,
  WizardResumo,
  WizardResumoLinha,
} from "@/components/ui/modal-wizard-shell"
import { comunicadosRequests } from "@/lib/api/requests/comunicados"
import { leituraRequests, cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { cn } from "@/lib/utils"
import type { TipoDestinatarioComunicado } from "@/lib/api/dtos/common"

const ETAPAS = ["Publico", "Destinatarios", "Conteudo", "Confirmar"]

type TipoPublico = TipoDestinatarioComunicado

interface Destinatario {
  id: string
  tipo: TipoPublico
  nome: string
}

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

const OPCOES_PUBLICO: {
  tipo: TipoPublico
  titulo: string
  descricao: string
  icone: LucideIcon
  apenasAdmin?: boolean
}[] = [
  {
    tipo: "turma",
    titulo: "Turmas",
    descricao: "Alunos das turmas selecionadas",
    icone: GraduationCap,
  },
  {
    tipo: "aluno",
    titulo: "Alunos",
    descricao: "Alunos especificos",
    icone: UserRound,
  },
  {
    tipo: "responsavel",
    titulo: "Responsaveis",
    descricao: "Responsaveis especificos",
    icone: HeartHandshake,
  },
  {
    tipo: "professor",
    titulo: "Professores",
    descricao: "Notificar professores da instituicao",
    icone: BookMarked,
    apenasAdmin: true,
  },
]

export function ModalCriarComunicadoWizard({ aberto, onOpenChange }: Props) {
  const { usuario } = useAuth()
  const qc = useQueryClient()
  const ehAdmin = usuario?.perfil === "administrador"
  const [etapa, setEtapa] = React.useState(0)
  const [tipoPublico, setTipoPublico] = React.useState<TipoPublico | null>(null)
  const [titulo, setTitulo] = React.useState("")
  const [corpo, setCorpo] = React.useState("")
  const [destinatarios, setDestinatarios] = React.useState<Destinatario[]>([])
  const [busca, setBusca] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  const { data: turmas = [] } = useQuery({
    queryKey: queryKeys.turmas.resumo(),
    queryFn: () => leituraRequests.listTurmas(),
    enabled: aberto && tipoPublico === "turma",
  })
  const { data: alunos = [] } = useQuery({
    queryKey: queryKeys.cadastros.alunos(),
    queryFn: () => cadastrosRequests.listAlunos(),
    enabled: aberto && tipoPublico === "aluno",
  })
  const { data: responsaveis = [] } = useQuery({
    queryKey: queryKeys.cadastros.responsaveis(),
    queryFn: () => cadastrosRequests.listResponsaveis(),
    enabled: aberto && tipoPublico === "responsavel",
  })
  const { data: professores = [] } = useQuery({
    queryKey: queryKeys.cadastros.professores(),
    queryFn: () => cadastrosRequests.listProfessores(),
    enabled: aberto && tipoPublico === "professor" && ehAdmin,
  })

  const catalogo = React.useMemo(() => {
    if (!tipoPublico) return []
    if (tipoPublico === "turma") {
      return turmas.map((t) => ({ id: t.id, tipo: "turma" as const, nome: t.nome }))
    }
    if (tipoPublico === "aluno") {
      return alunos.map((a) => ({
        id: a.id,
        tipo: "aluno" as const,
        nome: a.nome_exibicao,
      }))
    }
    if (tipoPublico === "responsavel") {
      return responsaveis.map((r) => ({
        id: r.id,
        tipo: "responsavel" as const,
        nome: r.nome_exibicao,
      }))
    }
    return professores.map((p) => ({
      id: p.id,
      tipo: "professor" as const,
      nome: p.nome_exibicao,
    }))
  }, [tipoPublico, turmas, alunos, responsaveis, professores])

  const catalogoFiltrado = React.useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return catalogo
    return catalogo.filter((i) => i.nome.toLowerCase().includes(q))
  }, [catalogo, busca])

  const reset = () => {
    setEtapa(0)
    setTipoPublico(null)
    setTitulo("")
    setCorpo("")
    setDestinatarios([])
    setBusca("")
  }

  const toggleDest = (d: Destinatario) => {
    setDestinatarios((prev) => {
      const exists = prev.some((x) => x.id === d.id && x.tipo === d.tipo)
      if (exists) return prev.filter((x) => !(x.id === d.id && x.tipo === d.tipo))
      return [...prev, d]
    })
  }

  const podeAvancar = () => {
    if (etapa === 0) return tipoPublico != null
    if (etapa === 1) return destinatarios.length > 0
    if (etapa === 2) return !!titulo.trim() && !!corpo.trim()
    return true
  }

  const salvar = async (publicar: boolean) => {
    setSalvando(true)
    try {
      let det = await comunicadosRequests.create({
        titulo: titulo.trim(),
        corpo: corpo.trim(),
        destinatarios: destinatarios.map((d) => ({ tipo: d.tipo, id: d.id })),
        status_inicial: publicar ? "publicado" : "rascunho",
      })
      if (publicar) det = await comunicadosRequests.publicar(det.id)
      toast.success(publicar ? "Comunicado publicado!" : "Rascunho salvo!")
      void qc.invalidateQueries({ queryKey: queryKeys.comunicados.lista() })
      reset()
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  const opcoesVisiveis = OPCOES_PUBLICO.filter((o) => !o.apenasAdmin || ehAdmin)

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Novo comunicado"
      etapas={ETAPAS}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={podeAvancar()}
      onSubmit={() => void salvar(true)}
      salvando={salvando}
      textoSubmit="Publicar"
      icone={Mail}
      onReset={reset}
    >
      {etapa === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {opcoesVisiveis.map((op) => (
            <WizardCardOption
              key={op.tipo}
              selecionado={tipoPublico === op.tipo}
              onClick={() => {
                setTipoPublico(op.tipo)
                setDestinatarios([])
                setBusca("")
              }}
              icone={op.icone}
              label={op.titulo}
              descricao={op.descricao}
            />
          ))}
        </div>
      )}

      {etapa === 1 && tipoPublico && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Selecione um ou mais{" "}
            {OPCOES_PUBLICO.find((o) => o.tipo === tipoPublico)?.titulo.toLowerCase()}
          </p>
          <Input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="rounded-xl"
          />
          <div className="max-h-48 overflow-y-auto space-y-2">
            {catalogoFiltrado.map((d) => {
              const sel = destinatarios.some((x) => x.id === d.id && x.tipo === d.tipo)
              const Icon =
                d.tipo === "turma"
                  ? GraduationCap
                  : d.tipo === "aluno"
                    ? UserRound
                    : d.tipo === "professor"
                      ? BookMarked
                      : HeartHandshake
              return (
                <button
                  key={`${d.tipo}-${d.id}`}
                  type="button"
                  onClick={() => toggleDest(d)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    sel ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{d.nome}</span>
                </button>
              )
            })}
          </div>
          {destinatarios.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {destinatarios.map((d) => (
                <Badge key={`${d.tipo}-${d.id}`} variant="secondary" className="rounded-full">
                  {d.nome}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {etapa === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titulo *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              className="rounded-xl min-h-[120px]"
            />
          </div>
        </div>
      )}

      {etapa === 3 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Publico" valor={tipoPublico ?? ""} />
          <WizardResumoLinha
            rotulo="Destinatarios"
            valor={`${destinatarios.length} selecionado(s)`}
          />
          <WizardResumoLinha rotulo="Titulo" valor={titulo} />
          <p className="text-sm text-muted-foreground line-clamp-3">{corpo}</p>
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}

export function ModalEditarComunicadoWizard({
  comunicadoId,
  tituloInicial,
  corpoInicial,
  aberto,
  onOpenChange,
}: {
  comunicadoId: string
  tituloInicial: string
  corpoInicial: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}) {
  const qc = useQueryClient()
  const [etapa, setEtapa] = React.useState(0)
  const [titulo, setTitulo] = React.useState(tituloInicial)
  const [corpo, setCorpo] = React.useState(corpoInicial)
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (aberto) {
      setTitulo(tituloInicial)
      setCorpo(corpoInicial)
      setEtapa(0)
    }
  }, [aberto, tituloInicial, corpoInicial])

  const salvar = async () => {
    setSalvando(true)
    try {
      await comunicadosRequests.patch(comunicadoId, {
        titulo: titulo.trim(),
        corpo: corpo.trim(),
      })
      toast.success("Comunicado atualizado!")
      void qc.invalidateQueries({ queryKey: queryKeys.comunicados.lista() })
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Editar comunicado"
      etapas={["Conteudo", "Confirmar"]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={!!titulo.trim() && !!corpo.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Salvar"
      icone={Mail}
    >
      {etapa === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} className="rounded-xl min-h-[120px]" />
          </div>
        </div>
      )}
      {etapa === 1 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Titulo" valor={titulo} />
          <p className="text-sm text-muted-foreground line-clamp-4">{corpo}</p>
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}
