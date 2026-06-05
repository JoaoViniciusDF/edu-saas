"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { GraduationCap, HeartHandshake, UserRound, Users } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ModalWizardShell,
  WizardResumo,
  WizardResumoLinha,
} from "@/components/ui/modal-wizard-shell"
import {
  getDescricaoVinculoResumo,
  PassoVinculoAlunoResponsavel,
  useVinculoAlunoResponsavel,
} from "@/componentes/shared/wizard-passo-vinculo-aluno-responsavel"
import {
  PassoAlunosTurmaOpcional,
  PassoProfessoresTurmaOpcional,
  PassoTurmaAlunoOpcional,
  PassoTurmasProfessorOpcional,
  resumoTurmaAluno,
  resumoTurmasProfessor,
  useAlunosTurmaOpcional,
  useProfessoresTurmaOpcional,
  useTurmaAlunoOpcional,
  useTurmasProfessorOpcional,
} from "@/componentes/shared/wizard-passos-turma-opcional"
import { cadastrosRequests } from "@/lib/api/requests/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import {
  executarCriacaoComVinculo,
  CriacaoParcialError,
} from "@/lib/configuracoes/criar-usuario-com-vinculo"
import {
  associarProfessoresTurmaOpcional,
  associarProfessorTurmasOpcional,
  matricularAlunoOpcional,
  matricularAlunosOpcional,
} from "@/lib/configuracoes/pos-criacao-turma-matricula"
import { mensagemErroApi } from "@/lib/formatacao/mascaras"

export type TipoCadastroWizard = "professor" | "aluno" | "responsavel" | "turma"

const CONFIG: Record<
  TipoCadastroWizard,
  { titulo: string; etapas: string[]; icone: typeof UserRound; queryKey: readonly string[] }
> = {
  professor: {
    titulo: "Novo professor",
    etapas: ["Dados", "Acesso", "Turmas", "Confirmar"],
    icone: GraduationCap,
    queryKey: queryKeys.cadastros.professores(),
  },
  aluno: {
    titulo: "Novo aluno",
    etapas: ["Dados", "Acesso", "Vínculo", "Turma", "Confirmar"],
    icone: UserRound,
    queryKey: queryKeys.cadastros.alunos(),
  },
  responsavel: {
    titulo: "Novo responsável",
    etapas: ["Dados", "Acesso", "Vínculo", "Confirmar"],
    icone: HeartHandshake,
    queryKey: queryKeys.cadastros.responsaveis(),
  },
  turma: {
    titulo: "Nova turma",
    etapas: ["Dados", "Alunos", "Professores", "Confirmar"],
    icone: Users,
    queryKey: queryKeys.cadastros.turmas(),
  },
}

interface Props {
  tipo: TipoCadastroWizard
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function ModalCriarCadastroWizard({ tipo, aberto, onOpenChange }: Props) {
  const qc = useQueryClient()
  const cfg = CONFIG[tipo]
  const [etapa, setEtapa] = React.useState(0)
  const [nome, setNome] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [senha, setSenha] = React.useState("")
  const [extra, setExtra] = React.useState("")
  const [anoLetivo, setAnoLetivo] = React.useState(String(new Date().getFullYear()))
  const [salvando, setSalvando] = React.useState(false)
  const vinculo = useVinculoAlunoResponsavel()
  const turmaAluno = useTurmaAlunoOpcional()
  const turmasProf = useTurmasProfessorOpcional()
  const alunosTurma = useAlunosTurmaOpcional()
  const professoresTurma = useProfessoresTurmaOpcional()

  const precisaVinculo = tipo === "aluno" || tipo === "responsavel"
  const passoAtual = cfg.etapas[etapa] ?? cfg.etapas[0]

  const { data: alunos } = useQuery({
    queryKey: ["vinculo-wizard", "alunos", "scoped"],
    queryFn: () => cadastrosRequests.listAlunos(),
    enabled: aberto && tipo === "responsavel",
  })

  const { data: responsaveis } = useQuery({
    queryKey: ["vinculo-wizard", "responsaveis", "scoped"],
    queryFn: () => cadastrosRequests.listResponsaveis(),
    enabled: aberto && tipo === "aluno",
  })

  const { data: turmasLista } = useQuery({
    queryKey: ["wizard", "turmas", "scoped"],
    queryFn: () => cadastrosRequests.listTurmas(),
    enabled: aberto && (tipo === "aluno" || tipo === "professor"),
  })

  const reset = () => {
    setEtapa(0)
    setNome("")
    setEmail("")
    setSenha("")
    setExtra("")
    setAnoLetivo(String(new Date().getFullYear()))
    vinculo.reset()
    turmaAluno.reset()
    turmasProf.reset()
    alunosTurma.reset()
    professoresTurma.reset()
  }

  const podeAvancar = () => {
    if (passoAtual === "Dados") {
      if (tipo === "turma") return !!nome.trim() && !!anoLetivo.trim()
      return !!nome.trim()
    }
    if (passoAtual === "Acesso") return !!email.trim() && !!senha.trim()
    if (passoAtual === "Vínculo") return vinculo.vinculoValido()
    if (passoAtual === "Turma") return turmaAluno.valido()
    if (passoAtual === "Turmas") return turmasProf.valido()
    if (passoAtual === "Alunos") return alunosTurma.valido()
    if (passoAtual === "Professores") return professoresTurma.valido()
    return true
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      let msgExtra: string | null = null

      if (tipo === "professor") {
        const res = await cadastrosRequests.createUsuario({
          tipo_perfil: "professor",
          nome_exibicao: nome.trim(),
          email: email.trim(),
          senha,
          registro_funcional: extra.trim() || null,
        })
        const profId = res.professor_id
        if (!profId) throw new Error("Resposta sem professor_id")
        msgExtra = await associarProfessorTurmasOpcional(profId, {
          ativo: turmasProf.ativo,
          turmaIds: turmasProf.turmaIds,
          titularTurmaIds: turmasProf.titularTurmaIds,
        })
      } else if (tipo === "aluno") {
        const alunoRes = await executarCriacaoComVinculo({
          modo: "aluno",
          principal: {
            tipo_perfil: "aluno",
            nome_exibicao: nome.trim(),
            email: email.trim().toLowerCase(),
            senha,
            matricula_codigo: extra.trim() || null,
          },
          vinculo,
        })
        const alunoId = alunoRes.aluno_id
        if (!alunoId) throw new Error("Resposta sem aluno_id")
        msgExtra = await matricularAlunoOpcional(alunoId, {
          ativo: turmaAluno.ativo,
          turmaId: turmaAluno.turmaId,
          dataInicio: turmaAluno.dataInicio,
        })
      } else if (tipo === "responsavel") {
        await executarCriacaoComVinculo({
          modo: "responsavel",
          principal: {
            tipo_perfil: "responsavel",
            nome_exibicao: nome.trim(),
            email: email.trim().toLowerCase(),
            senha,
            grau_parentesco: extra.trim() || null,
          },
          vinculo,
        })
      } else {
        const turmaRes = await cadastrosRequests.createTurma({
          nome: nome.trim(),
          ano_letivo: anoLetivo.trim(),
        })
        const msgAlunos = await matricularAlunosOpcional(turmaRes.id, {
          ativo: alunosTurma.ativo,
          alunoIds: [...alunosTurma.alunoIds],
          dataInicio: alunosTurma.dataInicio,
        })
        const msgProfs = await associarProfessoresTurmaOpcional(turmaRes.id, {
          ativo: professoresTurma.ativo,
          professorIds: [...professoresTurma.professorIds],
          titularProfessorId: professoresTurma.titularProfessorId,
        })
        msgExtra = [msgAlunos, msgProfs].filter(Boolean).join(" ") || null
      }

      toast.success(msgExtra ? `Cadastro criado. ${msgExtra}` : "Cadastro criado com sucesso!")
      void qc.invalidateQueries({ queryKey: cfg.queryKey })
      if (tipo === "aluno" || tipo === "responsavel" || tipo === "turma") {
        void qc.invalidateQueries({ queryKey: queryKeys.cadastros.alunos() })
      }
      if (tipo === "aluno" || tipo === "responsavel") {
        void qc.invalidateQueries({ queryKey: queryKeys.cadastros.responsaveis() })
      }
      if (tipo !== "responsavel") {
        void qc.invalidateQueries({ queryKey: queryKeys.cadastros.turmas() })
      }
      if (tipo === "professor" || tipo === "turma") {
        void qc.invalidateQueries({ queryKey: queryKeys.cadastros.professores() })
      }
      reset()
      onOpenChange(false)
    } catch (e: unknown) {
      if (e instanceof CriacaoParcialError) {
        toast.error(e.message)
      } else {
        toast.error(mensagemErroApi(e))
      }
    } finally {
      setSalvando(false)
    }
  }

  const extraLabel =
    tipo === "professor"
      ? "Registro funcional"
      : tipo === "aluno"
        ? "Matrícula"
        : tipo === "responsavel"
          ? "Grau de parentesco"
          : ""

  const descricaoVinculo =
    precisaVinculo
      ? getDescricaoVinculoResumo(tipo as "aluno" | "responsavel", vinculo, alunos, responsaveis)
      : null

  const descricaoTurmaAluno = resumoTurmaAluno(turmaAluno, turmasLista)
  const descricaoTurmasProf = resumoTurmasProfessor(turmasProf, turmasLista)

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo={cfg.titulo}
      etapas={cfg.etapas}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={podeAvancar()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Criar"
      icone={cfg.icone}
      onReset={reset}
    >
      {tipo === "turma" && passoAtual === "Dados" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da turma *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Ano letivo *</Label>
            <Input value={anoLetivo} onChange={(e) => setAnoLetivo(e.target.value)} className="rounded-xl" />
          </div>
        </div>
      )}

      {tipo !== "turma" && passoAtual === "Dados" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="rounded-xl" />
          </div>
          {extraLabel && (
            <div className="space-y-2">
              <Label>{extraLabel}</Label>
              <Input value={extra} onChange={(e) => setExtra(e.target.value)} className="rounded-xl" />
            </div>
          )}
        </div>
      )}

      {tipo !== "turma" && passoAtual === "Acesso" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Senha *</Label>
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="rounded-xl" />
          </div>
        </div>
      )}

      {precisaVinculo && passoAtual === "Vínculo" && (
        <PassoVinculoAlunoResponsavel
          modo={tipo as "aluno" | "responsavel"}
          ativo={aberto}
          vinculo={vinculo}
        />
      )}

      {tipo === "aluno" && passoAtual === "Turma" && (
        <PassoTurmaAlunoOpcional ativo={aberto} vinculo={turmaAluno} />
      )}

      {tipo === "professor" && passoAtual === "Turmas" && (
        <PassoTurmasProfessorOpcional ativo={aberto} vinculo={turmasProf} />
      )}

      {tipo === "turma" && passoAtual === "Alunos" && (
        <PassoAlunosTurmaOpcional ativo={aberto} vinculo={alunosTurma} />
      )}

      {tipo === "turma" && passoAtual === "Professores" && (
        <PassoProfessoresTurmaOpcional ativo={aberto} vinculo={professoresTurma} />
      )}

      {passoAtual === "Confirmar" && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Nome" valor={nome} />
          {tipo === "turma" ? (
            <>
              <WizardResumoLinha rotulo="Ano letivo" valor={anoLetivo} />
              {alunosTurma.ativo && alunosTurma.alunoIds.size > 0 && (
                <WizardResumoLinha
                  rotulo="Alunos"
                  valor={`${alunosTurma.alunoIds.size} aluno(s) · início ${alunosTurma.dataInicio}`}
                />
              )}
              {professoresTurma.ativo && professoresTurma.professorIds.size > 0 && (
                <WizardResumoLinha
                  rotulo="Professores"
                  valor={`${professoresTurma.professorIds.size} professor(es)`}
                />
              )}
            </>
          ) : (
            <>
              <WizardResumoLinha rotulo="E-mail" valor={email} />
              {extra && <WizardResumoLinha rotulo={extraLabel} valor={extra} />}
              {descricaoVinculo && (
                <WizardResumoLinha
                  rotulo={tipo === "aluno" ? "Responsável" : "Aluno vinculado"}
                  valor={descricaoVinculo}
                />
              )}
              {precisaVinculo && vinculo.responsavelPrincipal && (
                <WizardResumoLinha rotulo="Responsável principal" valor="Sim" />
              )}
              {descricaoTurmaAluno && (
                <WizardResumoLinha rotulo="Turma" valor={descricaoTurmaAluno} />
              )}
              {descricaoTurmasProf && (
                <WizardResumoLinha rotulo="Turmas" valor={descricaoTurmasProf} />
              )}
            </>
          )}
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}
