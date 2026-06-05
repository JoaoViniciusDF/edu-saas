"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  GraduationCap,
  LogIn,
  Shield,
  UserPlus,
  UserRound,
  Users,
  HeartHandshake,
} from "lucide-react"
import { BreadcrumbSuperAdmin } from "@/componentes/super-admin/breadcrumb-super-admin"
import {
  FiltrosDiretorio,
  type FiltrosDiretorioState,
} from "@/componentes/super-admin/filtros-diretorio"
import { ModalCriarUsuarioInstituicaoWizard } from "@/componentes/super-admin/modal-criar-usuario-instituicao-wizard"
import { ModalGerenciarTurma } from "@/componentes/super-admin/modal-gerenciar-turma"
import { TabelaDiretorioPlataforma } from "@/componentes/super-admin/tabela-diretorio-plataforma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { authRequests, configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { DiretorioPlataformaItem, TipoPerfilUsuario } from "@/lib/api/dtos/configuracoes"
import { ROTA_HOME_POR_PERFIL } from "@/lib/auth/rotas-por-perfil"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { cn } from "@/lib/utils"

const KPI_CONFIG = [
  { key: "contagem_administradores" as const, label: "Administradores", icon: Shield, cor: "bg-violet-500/10 text-violet-600" },
  { key: "contagem_professores" as const, label: "Professores", icon: GraduationCap, cor: "bg-blue-500/10 text-blue-600" },
  { key: "contagem_turmas" as const, label: "Turmas", icon: Users, cor: "bg-amber-500/10 text-amber-600" },
  { key: "contagem_alunos" as const, label: "Alunos", icon: UserRound, cor: "bg-emerald-500/10 text-emerald-600" },
  { key: "contagem_responsaveis" as const, label: "Responsáveis", icon: HeartHandshake, cor: "bg-rose-500/10 text-rose-600" },
]

export default function InstituicaoDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { recarregar } = useAuth()

  const [filtros, setFiltros] = React.useState<FiltrosDiretorioState>({
    visao: "usuarios",
    instituicaoId: id,
    turmaIds: [],
    perfil: "",
    busca: "",
  })
  const [turmaGerenciar, setTurmaGerenciar] = React.useState<DiretorioPlataformaItem | null>(null)
  const [modalUsuario, setModalUsuario] = React.useState(false)

  React.useEffect(() => {
    setFiltros((f) => ({ ...f, instituicaoId: id }))
  }, [id])

  const { data: resumo, isLoading } = useQuery({
    queryKey: ["super-admin", "instituicao", id, "resumo"],
    queryFn: () => configuracoesRequests.getResumoInstituicao(id),
  })

  const entrarComo = async (item: DiretorioPlataformaItem) => {
    if (!item.usuario_id) return
    sessionStorage.setItem("edu_impersonacao_instituicao_id", id)
    await authRequests.assumirSessao(item.usuario_id)
    await recarregar()
    const perfil = item.perfil as TipoPerfilUsuario
    router.push(ROTA_HOME_POR_PERFIL[perfil])
  }

  if (isLoading || !resumo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {KPI_CONFIG.map((k) => (
            <Skeleton key={k.key} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbSuperAdmin
        items={[{ label: resumo.instituicao.nome_fantasia }]}
      />

      <div className="border-l-4 border-primary/40 pl-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {resumo.instituicao.nome_fantasia}
        </h1>
        <p className="text-sm text-muted-foreground">
          {resumo.instituicao.documento_legal ?? "Sem documento cadastrado"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPI_CONFIG.map((k) => {
          const Icon = k.icon
          return (
            <Card
              key={k.key}
              className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm"
            >
              <CardContent className="p-5">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", k.cor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold">{resumo[k.key]}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pessoas da instituição
          </h2>
          <Button
            className="rounded-xl gap-2 bg-gradient-to-br from-primary to-primary/80 shadow-soft"
            onClick={() => setModalUsuario(true)}
          >
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </Button>
        </div>
        <FiltrosDiretorio
          filtros={filtros}
          onChange={setFiltros}
          instituicaoFixa={id}
          visoesDisponiveis={["usuarios", "turmas"]}
        />
        <TabelaDiretorioPlataforma
          filtros={{ ...filtros, instituicaoId: id }}
          queryKeyPrefix={`super-admin-inst-${id}`}
          onRowClick={(item) => {
            if (filtros.visao === "turmas") {
              setTurmaGerenciar(item)
              return
            }
            const uid = item.usuario_id ?? item.id
            if (uid) router.push(`/super-admin/usuario/${uid}`)
          }}
          renderAcoes={(item) => {
            if (filtros.visao === "turmas") {
              return (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTurmaGerenciar(item)
                  }}
                >
                  Gerenciar
                </Button>
              )
            }
            return item.usuario_id && item.perfil !== "super_admin" ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  void entrarComo(item)
                }}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar como
              </Button>
            ) : null
          }}
        />
        {turmaGerenciar && (
          <ModalGerenciarTurma
            open={!!turmaGerenciar}
            onOpenChange={(o) => !o && setTurmaGerenciar(null)}
            turma={turmaGerenciar}
            instituicaoId={id}
          />
        )}
        <ModalCriarUsuarioInstituicaoWizard
          aberto={modalUsuario}
          onOpenChange={setModalUsuario}
          instituicaoId={id}
          instituicaoNome={resumo.instituicao.nome_fantasia}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Dica: selecione turmas no filtro para ver apenas alunos matriculados e professores titulares.
        Administradores permanecem visíveis com filtro de turma ativo.
      </p>
    </div>
  )
}
