"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  Calendar,
  Hash,
  LogIn,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react"
import { BadgePerfil } from "@/componentes/super-admin/badge-perfil"
import { BreadcrumbSuperAdmin } from "@/componentes/super-admin/breadcrumb-super-admin"
import { CampoInfo } from "@/componentes/super-admin/usuario/campo-info"
import { ModalEditarUsuario } from "@/componentes/super-admin/usuario/modal-editar-usuario"
import { ResultadoLote } from "@/componentes/super-admin/usuario/resultado-lote"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authRequests, configuracoesRequests } from "@/lib/api/requests/configuracoes"
import type { LoteResultadoResponse, UsuarioSuperAdminPatch } from "@/lib/api/dtos/configuracoes"
import { ROTA_HOME_POR_PERFIL } from "@/lib/auth/rotas-por-perfil"
import { useAuth } from "@/componentes/provedores/provedor-auth"
import { queryKeys } from "@/lib/cache/query-keys"

interface Props {
  usuarioId: string
}

export function DetalheUsuarioView({ usuarioId }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { recarregar } = useAuth()
  const [editOpen, setEditOpen] = React.useState(false)
  const [desativarOpen, setDesativarOpen] = React.useState(false)
  const [loteResultado, setLoteResultado] = React.useState<LoteResultadoResponse | null>(null)

  const [modalMatricula, setModalMatricula] = React.useState(false)
  const [modalResp, setModalResp] = React.useState(false)
  const [modalProfTurmas, setModalProfTurmas] = React.useState(false)
  const [turmaSel, setTurmaSel] = React.useState("")
  const [dataInicio, setDataInicio] = React.useState(new Date().toISOString().slice(0, 10))
  const [alunosSel, setAlunosSel] = React.useState<Set<string>>(new Set())
  const [turmasSel, setTurmasSel] = React.useState<Set<string>>(new Set())
  const [respSel, setRespSel] = React.useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "usuario", usuarioId],
    queryFn: () => configuracoesRequests.getDetalheUsuario(usuarioId),
  })

  const instId = data?.instituicao?.id

  const { data: instituicoes } = useQuery({
    queryKey: queryKeys.superAdmin.instituicoes(),
    queryFn: async () => {
      const res = await configuracoesRequests.listInstituicoes()
      return res.items
    },
  })

  const { data: turmas } = useQuery({
    queryKey: ["super-admin", "turmas", instId],
    queryFn: () => configuracoesRequests.listTurmas({ instituicao_id: instId! }),
    enabled: !!instId,
  })

  const { data: alunosInst } = useQuery({
    queryKey: ["super-admin", "alunos", instId],
    queryFn: () => configuracoesRequests.listAlunos(instId),
    enabled: !!instId && data?.tipo_perfil === "responsavel",
  })

  const { data: responsaveisInst } = useQuery({
    queryKey: ["super-admin", "responsaveis", instId],
    queryFn: () => configuracoesRequests.listResponsaveis(instId),
    enabled: !!instId && data?.tipo_perfil === "aluno",
  })

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["super-admin"] })
  }

  const patchMut = useMutation({
    mutationFn: (body: UsuarioSuperAdminPatch) =>
      configuracoesRequests.patchUsuarioSuperAdmin(usuarioId, body),
    onSuccess: invalidar,
  })

  const instMut = useMutation({
    mutationFn: (instituicao_id: string) =>
      configuracoesRequests.associarUsuarioInstituicao(usuarioId, { instituicao_id }),
    onSuccess: invalidar,
  })

  const desativarMut = useMutation({
    mutationFn: () => configuracoesRequests.desativarUsuario(usuarioId),
    onSuccess: () => {
      invalidar()
      router.push(data?.instituicao ? `/super-admin/instituicoes/${data.instituicao.id}` : "/super-admin")
    },
  })

  const entrarComo = async () => {
    if (!data) return
    if (data.instituicao?.id) {
      sessionStorage.setItem("edu_impersonacao_instituicao_id", data.instituicao.id)
    }
    await authRequests.assumirSessao(data.usuario_id)
    // Limpa o cache para que a nova identidade não reaproveite dados
    // (views de prova, submissões, etc.) carregados pela sessão anterior.
    queryClient.clear()
    await recarregar()
    router.push(ROTA_HOME_POR_PERFIL[data.tipo_perfil])
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const crumbs = [
    ...(data.instituicao
      ? [{ label: data.instituicao.nome_fantasia, href: `/super-admin/instituicoes/${data.instituicao.id}` }]
      : []),
    { label: data.nome_exibicao },
  ]

  const matricularLote = async () => {
    if (!instId || !data.aluno_id || !turmaSel) return
    const res = await configuracoesRequests.criarMatriculasLote({
      instituicao_id: instId,
      turma_id: turmaSel,
      aluno_ids: [data.aluno_id],
      data_inicio: dataInicio,
    })
    setLoteResultado(res)
    setModalMatricula(false)
    invalidar()
  }

  const encerrarMatricula = async (matId: string) => {
    if (!instId) return
    await configuracoesRequests.patchMatriculaSuperAdmin(matId, instId, {
      situacao: "encerrada",
      data_fim: new Date().toISOString().slice(0, 10),
    })
    invalidar()
  }

  const vincularRespLote = async () => {
    if (!instId || !data.aluno_id || respSel.size === 0) return
    for (const respId of respSel) {
      const res = await configuracoesRequests.vincularResponsavelAlunosLote({
        instituicao_id: instId,
        responsavel_id: respId,
        aluno_ids: [data.aluno_id],
      })
      setLoteResultado(res)
    }
    setModalResp(false)
    setRespSel(new Set())
    invalidar()
  }

  const vincularAlunosResp = async () => {
    if (!instId || !data.responsavel_id || alunosSel.size === 0) return
    const res = await configuracoesRequests.vincularResponsavelAlunosLote({
      instituicao_id: instId,
      responsavel_id: data.responsavel_id,
      aluno_ids: [...alunosSel],
    })
    setLoteResultado(res)
    setAlunosSel(new Set())
    invalidar()
  }

  const desvincularAluno = async (alunoId: string) => {
    if (!instId || !data.responsavel_id) return
    const res = await configuracoesRequests.desvincularResponsavelAlunosLote({
      instituicao_id: instId,
      responsavel_id: data.responsavel_id,
      aluno_ids: [alunoId],
    })
    setLoteResultado(res)
    invalidar()
  }

  const associarTurmasProf = async () => {
    if (!instId || !data.professor_id || turmasSel.size === 0) return
    const res = await configuracoesRequests.associarProfessorTurmasLote({
      instituicao_id: instId,
      professor_id: data.professor_id,
      turma_ids: [...turmasSel],
    })
    setLoteResultado(res)
    setModalProfTurmas(false)
    setTurmasSel(new Set())
    invalidar()
  }

  const desassociarTurma = async (turmaId: string) => {
    if (!instId || !data.professor_id) return
    const res = await configuracoesRequests.desassociarProfessorTurmasLote({
      instituicao_id: instId,
      turma_ids: [turmaId],
      professor_id: data.professor_id,
    })
    setLoteResultado(res)
    invalidar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BreadcrumbSuperAdmin items={crumbs} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-2 text-destructive hover:text-destructive"
            onClick={() => setDesativarOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Desativar
          </Button>
          <Button
            className="rounded-xl gap-2 bg-gradient-to-br from-primary to-primary/80"
            onClick={() => void entrarComo()}
          >
            <LogIn className="h-4 w-4" />
            Entrar como
          </Button>
        </div>
      </div>

      <ResultadoLote resultado={loteResultado} />

      <div className="border-l-4 border-primary/40 pl-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {data.nome_exibicao}
          </h1>
          <BadgePerfil perfil={data.tipo_perfil} />
          {data.status_conta !== "ativa" && (
            <span className="text-xs rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5">
              {data.status_conta}
            </span>
          )}
        </div>
        {data.nome_social && (
          <p className="text-sm text-muted-foreground">Nome social: {data.nome_social}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoInfo icone={Mail} label="E-mail" valor={data.email} />
        {data.tipo_perfil === "aluno" && (
          <CampoInfo icone={Hash} label="Matrícula" valor={data.matricula_codigo ?? "—"} />
        )}
        {data.tipo_perfil === "aluno" && (
          <CampoInfo icone={Calendar} label="Nascimento" valor={data.data_nascimento ?? "—"} />
        )}
        {data.tipo_perfil === "professor" && (
          <CampoInfo icone={Hash} label="Registro" valor={data.registro_funcional ?? "—"} />
        )}
        <CampoInfo
          icone={Building2}
          label="Instituição"
          valor={data.instituicao?.nome_fantasia ?? "—"}
        />
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Instituição</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1 space-y-2">
            <Label>Vincular à escola</Label>
            <Select
              value={data.instituicao?.id ?? ""}
              onValueChange={(v) => void instMut.mutateAsync(v)}
              disabled={instMut.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a instituição" />
              </SelectTrigger>
              <SelectContent>
                {instituicoes?.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {data.tipo_perfil === "administrador" && data.instituicao && (
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href={`/super-admin/instituicoes/${data.instituicao.id}`}>
                Ver instituição
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {data.tipo_perfil === "aluno" && (
        <>
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Turmas e matrículas</CardTitle>
              <Button size="sm" className="rounded-xl" onClick={() => setModalMatricula(true)}>
                Matricular em turma
              </Button>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              {!data.matriculas?.length ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">Nenhuma matrícula.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.matriculas.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.turma_nome}</TableCell>
                        <TableCell>{m.ano_letivo}</TableCell>
                        <TableCell>{m.situacao}</TableCell>
                        <TableCell>
                          {m.situacao === "ativa" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void encerrarMatricula(m.id)}
                            >
                              Encerrar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Responsáveis</CardTitle>
              <Button size="sm" className="rounded-xl" onClick={() => setModalResp(true)}>
                Vincular responsável
              </Button>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              {!data.responsaveis?.length ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">Nenhum vínculo.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Parentesco</TableHead>
                      <TableHead>Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.responsaveis.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.nome_exibicao}</TableCell>
                        <TableCell>{r.grau_parentesco ?? "—"}</TableCell>
                        <TableCell>{r.responsavel_principal ? "Sim" : "Não"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {data.tipo_perfil === "professor" && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Turmas titulares</CardTitle>
            <Button size="sm" className="rounded-xl" onClick={() => setModalProfTurmas(true)}>
              Associar turmas
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {!data.turmas_titulares?.length ? (
              <p className="px-6 pb-4 text-sm text-muted-foreground">Nenhuma turma.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.turmas_titulares.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.nome}</TableCell>
                      <TableCell>{t.ano_letivo}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void desassociarTurma(t.id)}
                        >
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {data.tipo_perfil === "responsavel" && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alunos vinculados</CardTitle>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setAlunosSel(new Set())
                setModalResp(true)
              }}
            >
              Vincular alunos
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {!data.alunos_vinculados?.length ? (
              <p className="px-6 pb-4 text-sm text-muted-foreground">Nenhum aluno.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Turmas</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.alunos_vinculados.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          href={`/super-admin/usuario/${a.usuario_id}`}
                          className="text-primary hover:underline"
                        >
                          {a.nome_exibicao}
                        </Link>
                      </TableCell>
                      <TableCell>{a.matricula_codigo ?? "—"}</TableCell>
                      <TableCell>{a.turmas.map((t) => t.nome).join(", ") || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void desvincularAluno(a.id)}
                        >
                          Desvincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <ModalEditarUsuario
        open={editOpen}
        onOpenChange={setEditOpen}
        data={data}
        onSalvar={async (body) => {
          await patchMut.mutateAsync(body)
        }}
        salvando={patchMut.isPending}
      />

      <AlertDialog open={desativarOpen} onOpenChange={setDesativarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta de {data.nome_exibicao} será suspensa e não poderá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void desativarMut.mutateAsync()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={modalMatricula} onOpenChange={setModalMatricula}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Matricular em turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={turmaSel} onValueChange={setTurmaSel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome} ({t.ano_letivo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void matricularLote()}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalResp && data.tipo_perfil === "aluno"} onOpenChange={setModalResp}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular responsável</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {responsaveisInst?.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={respSel.has(r.id)}
                  onCheckedChange={(c) => {
                    const next = new Set(respSel)
                    if (c) next.add(r.id)
                    else next.delete(r.id)
                    setRespSel(next)
                  }}
                />
                {r.nome_exibicao} ({r.email})
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => void vincularRespLote()}>Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalResp && data.tipo_perfil === "responsavel"}
        onOpenChange={setModalResp}
      >
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular alunos</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {alunosInst?.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={alunosSel.has(a.id)}
                  onCheckedChange={(c) => {
                    const next = new Set(alunosSel)
                    if (c) next.add(a.id)
                    else next.delete(a.id)
                    setAlunosSel(next)
                  }}
                />
                {a.nome_exibicao}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => void vincularAlunosResp()}>Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalProfTurmas} onOpenChange={setModalProfTurmas}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Associar turmas titulares</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {turmas?.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={turmasSel.has(t.id)}
                  onCheckedChange={(c) => {
                    const next = new Set(turmasSel)
                    if (c) next.add(t.id)
                    else next.delete(t.id)
                    setTurmasSel(next)
                  }}
                />
                {t.nome} ({t.ano_letivo})
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => void associarTurmasProf()}>Associar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
