"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { ModalWizardShell, WizardResumoLinha } from "@/components/ui/modal-wizard-shell"
import {
  getDescricaoVinculoResumo,
  PassoVinculoAlunoResponsavel,
  useVinculoAlunoResponsavel,
} from "@/componentes/shared/wizard-passo-vinculo-aluno-responsavel"
import {
  PassoTurmaAlunoOpcional,
  PassoTurmasProfessorOpcional,
  resumoTurmaAluno,
  resumoTurmasProfessor,
  useTurmaAlunoOpcional,
  useTurmasProfessorOpcional,
} from "@/componentes/shared/wizard-passos-turma-opcional"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { PERFIS_CRIACAO_INSTITUICAO } from "@/lib/api/dtos/configuracoes"
import type { TipoPerfilUsuario } from "@/lib/api/dtos/configuracoes"
import { queryKeys } from "@/lib/cache/query-keys"
import { executarCriacaoComVinculo, CriacaoParcialError } from "@/lib/configuracoes/criar-usuario-com-vinculo"
import {
  associarProfessorTurmasOpcional,
  matricularAlunoOpcional,
} from "@/lib/configuracoes/pos-criacao-turma-matricula"
import { mensagemErroApi } from "@/lib/formatacao/mascaras"
import {
  PassoConfirmarUsuario,
  PassoDadosUsuario,
  PassoSelecionarPerfil,
  useFormularioCriarUsuario,
} from "./wizard-criar-usuario-passos"

function etapasParaPerfil(perfil: TipoPerfilUsuario | ""): string[] {
  if (perfil === "aluno") return ["Perfil", "Dados", "Vínculo", "Turma", "Confirmar"]
  if (perfil === "responsavel") return ["Perfil", "Dados", "Vínculo", "Confirmar"]
  if (perfil === "professor") return ["Perfil", "Dados", "Turmas", "Confirmar"]
  return ["Perfil", "Dados", "Confirmar"]
}

interface Props {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  instituicaoId: string
  instituicaoNome: string
}

export function ModalCriarUsuarioInstituicaoWizard({
  aberto,
  onOpenChange,
  instituicaoId,
  instituicaoNome,
}: Props) {
  const qc = useQueryClient()
  const [etapa, setEtapa] = React.useState(0)
  const [salvando, setSalvando] = React.useState(false)
  const form = useFormularioCriarUsuario()
  const vinculo = useVinculoAlunoResponsavel()
  const turmaAluno = useTurmaAlunoOpcional()
  const turmasProf = useTurmasProfessorOpcional()

  const etapas = etapasParaPerfil(form.perfil)
  const passoAtual = etapas[etapa] ?? etapas[0]
  const precisaVinculo = form.perfil === "aluno" || form.perfil === "responsavel"

  const { data: alunos } = useQuery({
    queryKey: ["vinculo-wizard", "alunos", instituicaoId],
    queryFn: () => configuracoesRequests.listAlunos(instituicaoId),
    enabled: aberto && form.perfil === "responsavel",
  })

  const { data: responsaveis } = useQuery({
    queryKey: ["vinculo-wizard", "responsaveis", instituicaoId],
    queryFn: () => configuracoesRequests.listResponsaveis(instituicaoId),
    enabled: aberto && form.perfil === "aluno",
  })

  const { data: turmasLista } = useQuery({
    queryKey: ["wizard", "turmas", instituicaoId],
    queryFn: () => configuracoesRequests.listTurmas({ instituicao_id: instituicaoId }),
    enabled: aberto && (form.perfil === "aluno" || form.perfil === "professor"),
  })

  const reset = () => {
    setEtapa(0)
    form.reset()
    vinculo.reset()
    turmaAluno.reset()
    turmasProf.reset()
  }

  const selecionarPerfil = (p: TipoPerfilUsuario) => {
    form.setPerfil(p)
    if (p !== "aluno" && p !== "responsavel") {
      vinculo.reset()
    }
    if (p !== "aluno") turmaAluno.reset()
    if (p !== "professor") turmasProf.reset()
    setEtapa(0)
  }

  React.useEffect(() => {
    if (etapa >= etapas.length) {
      setEtapa(Math.max(0, etapas.length - 1))
    }
  }, [etapas.length, etapa])

  const podeAvancar = () => {
    if (passoAtual === "Perfil") return !!form.perfil
    if (passoAtual === "Dados") return form.dadosValidos
    if (passoAtual === "Vínculo") return vinculo.vinculoValido()
    if (passoAtual === "Turma") return turmaAluno.valido()
    if (passoAtual === "Turmas") return turmasProf.valido()
    return true
  }

  const salvar = async () => {
    if (!form.perfil) return
    setSalvando(true)
    try {
      const principal = {
        tipo_perfil: form.perfil,
        instituicao_id: instituicaoId,
        nome_exibicao: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        matricula_codigo: form.matricula.trim() || undefined,
        registro_funcional: form.registro.trim() || undefined,
        grau_parentesco: form.grauParentesco.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
      }

      let msgExtra: string | null = null

      if (precisaVinculo) {
        const res = await executarCriacaoComVinculo({
          modo: form.perfil as "aluno" | "responsavel",
          principal,
          vinculo,
          instituicaoId,
        })
        if (form.perfil === "aluno") {
          const alunoId = res.aluno_id
          if (!alunoId) throw new Error("Resposta sem aluno_id")
          msgExtra = await matricularAlunoOpcional(alunoId, {
            ativo: turmaAluno.ativo,
            turmaId: turmaAluno.turmaId,
            dataInicio: turmaAluno.dataInicio,
            instituicaoId,
          })
        }
      } else if (form.perfil === "professor") {
        const res = await configuracoesRequests.createUsuario(principal)
        const profId = res.professor_id
        if (!profId) throw new Error("Resposta sem professor_id")
        msgExtra = await associarProfessorTurmasOpcional(profId, {
          ativo: turmasProf.ativo,
          turmaIds: turmasProf.turmaIds,
          titularTurmaIds: turmasProf.titularTurmaIds,
          instituicaoId,
        })
      } else {
        await configuracoesRequests.createUsuario(principal)
      }

      toast.success(msgExtra ? `Usuário criado. ${msgExtra}` : "Usuário criado com sucesso!")
      void qc.invalidateQueries({ queryKey: ["super-admin", "instituicao", instituicaoId] })
      void qc.invalidateQueries({ queryKey: queryKeys.superAdmin.resumo() })
      void qc.invalidateQueries({ queryKey: ["super-admin", "diretorio"] })
      void qc.invalidateQueries({ queryKey: queryKeys.cadastros.alunos() })
      void qc.invalidateQueries({ queryKey: queryKeys.cadastros.responsaveis() })
      void qc.invalidateQueries({ queryKey: queryKeys.cadastros.turmas() })
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

  const descricaoVinculo =
    precisaVinculo && form.perfil
      ? getDescricaoVinculoResumo(form.perfil as "aluno" | "responsavel", vinculo, alunos, responsaveis)
      : null

  const descricaoTurmaAluno = resumoTurmaAluno(turmaAluno, turmasLista)
  const descricaoTurmasProf = resumoTurmasProfessor(turmasProf, turmasLista)

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Novo usuário"
      etapas={[...etapas]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={podeAvancar()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Criar usuário"
      icone={UserPlus}
      onReset={reset}
    >
      <p className="-mt-1 mb-4 text-sm text-muted-foreground">
        Em <span className="font-medium text-foreground">{instituicaoNome}</span>
      </p>

      {passoAtual === "Perfil" && (
        <PassoSelecionarPerfil
          perfis={PERFIS_CRIACAO_INSTITUICAO}
          perfil={form.perfil}
          onSelecionar={selecionarPerfil}
        />
      )}
      {passoAtual === "Dados" && (
        <PassoDadosUsuario
          perfil={form.perfil}
          nome={form.nome}
          setNome={form.setNome}
          email={form.email}
          setEmail={form.setEmail}
          senha={form.senha}
          setSenha={form.setSenha}
          matricula={form.matricula}
          setMatricula={form.setMatricula}
          registro={form.registro}
          setRegistro={form.setRegistro}
          grauParentesco={form.grauParentesco}
          setGrauParentesco={form.setGrauParentesco}
          telefone={form.telefone}
          setTelefone={form.setTelefone}
        />
      )}
      {passoAtual === "Vínculo" && precisaVinculo && form.perfil && (
        <PassoVinculoAlunoResponsavel
          modo={form.perfil as "aluno" | "responsavel"}
          instituicaoId={instituicaoId}
          ativo={aberto}
          vinculo={vinculo}
        />
      )}
      {form.perfil === "aluno" && passoAtual === "Turma" && (
        <PassoTurmaAlunoOpcional
          instituicaoId={instituicaoId}
          ativo={aberto}
          vinculo={turmaAluno}
        />
      )}
      {form.perfil === "professor" && passoAtual === "Turmas" && (
        <PassoTurmasProfessorOpcional
          instituicaoId={instituicaoId}
          ativo={aberto}
          vinculo={turmasProf}
        />
      )}
      {passoAtual === "Confirmar" && (
        <>
          <PassoConfirmarUsuario
            perfil={form.perfil}
            nome={form.nome}
            email={form.email}
            matricula={form.matricula}
            registro={form.registro}
            instituicaoNome={instituicaoNome}
          />
          {(descricaoVinculo || descricaoTurmaAluno || descricaoTurmasProf) && (
            <div className="-mt-2 rounded-2xl border border-border/50 bg-muted/20 p-5 space-y-1">
              {descricaoVinculo && (
                <WizardResumoLinha
                  rotulo={form.perfil === "aluno" ? "Responsável" : "Aluno vinculado"}
                  valor={descricaoVinculo}
                />
              )}
              {vinculo.responsavelPrincipal && (
                <WizardResumoLinha rotulo="Responsável principal" valor="Sim" />
              )}
              {descricaoTurmaAluno && (
                <WizardResumoLinha rotulo="Turma" valor={descricaoTurmaAluno} />
              )}
              {descricaoTurmasProf && (
                <WizardResumoLinha rotulo="Turmas" valor={descricaoTurmasProf} />
              )}
            </div>
          )}
        </>
      )}
    </ModalWizardShell>
  )
}
