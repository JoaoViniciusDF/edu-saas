import type { LoteResultadoResponse } from "@/lib/api/dtos/configuracoes"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { ApiError } from "@/lib/api/errors"

export function toastLoteParcial(res: LoteResultadoResponse, sucessoMsg: string) {
  if (res.falhas.length > 0) {
    const detalhe = res.falhas.map((f) => f.motivo).join("; ")
    return `${sucessoMsg} (${res.sucesso.length} ok, ${res.falhas.length} falha(s): ${detalhe})`
  }
  return sucessoMsg
}

export async function matricularAlunoOpcional(
  alunoId: string,
  opts: {
    ativo: boolean
    turmaId: string
    dataInicio: string
    instituicaoId?: string
  }
): Promise<string | null> {
  if (!opts.ativo || !opts.turmaId) return null
  if (opts.instituicaoId) {
    const res = await configuracoesRequests.criarMatriculasLote({
      instituicao_id: opts.instituicaoId,
      turma_id: opts.turmaId,
      aluno_ids: [alunoId],
      data_inicio: opts.dataInicio,
    })
    return toastLoteParcial(res, "Aluno matriculado na turma.")
  }
  await configuracoesRequests.createMatricula({
    aluno_id: alunoId,
    turma_id: opts.turmaId,
    data_inicio: opts.dataInicio,
  })
  return "Aluno matriculado na turma."
}

export async function matricularAlunosOpcional(
  turmaId: string,
  opts: {
    ativo: boolean
    alunoIds: string[]
    dataInicio: string
    instituicaoId?: string
  }
): Promise<string | null> {
  if (!opts.ativo || opts.alunoIds.length === 0) return null
  if (opts.instituicaoId) {
    const res = await configuracoesRequests.criarMatriculasLote({
      instituicao_id: opts.instituicaoId,
      turma_id: turmaId,
      aluno_ids: opts.alunoIds,
      data_inicio: opts.dataInicio,
    })
    return toastLoteParcial(res, "Alunos matriculados na turma.")
  }
  for (const alunoId of opts.alunoIds) {
    try {
      await configuracoesRequests.createMatricula({
        aluno_id: alunoId,
        turma_id: turmaId,
        data_inicio: opts.dataInicio,
      })
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) continue
      throw e
    }
  }
  return "Alunos matriculados na turma."
}

export async function associarProfessorTurmasOpcional(
  professorId: string,
  opts: {
    ativo: boolean
    turmaIds: Iterable<string>
    titularTurmaIds: Iterable<string>
    instituicaoId?: string
  }
): Promise<string | null> {
  const turmaIds = [...opts.turmaIds]
  if (!opts.ativo || turmaIds.length === 0) return null
  const instId = opts.instituicaoId ?? (await resolverInstituicaoId())
  const titulares = [...opts.titularTurmaIds].filter((id) => turmaIds.includes(id))
  const res = await configuracoesRequests.associarProfessorTurmasLote({
    instituicao_id: instId,
    professor_id: professorId,
    turma_ids: turmaIds,
    professor_titular_turma_id: titulares[0] ?? undefined,
  })
  let msg = toastLoteParcial(res, "Professor associado às turmas.")
  for (const tid of titulares.slice(1)) {
    const extra = await configuracoesRequests.associarProfessorTurmasLote({
      instituicao_id: instId,
      professor_id: professorId,
      turma_ids: [tid],
      professor_titular_turma_id: tid,
    })
    msg = toastLoteParcial(extra, msg)
  }
  return msg
}

export async function associarProfessoresTurmaOpcional(
  turmaId: string,
  opts: {
    ativo: boolean
    professorIds: Iterable<string>
    titularProfessorId: string
    instituicaoId?: string
  }
): Promise<string | null> {
  const professorIds = [...opts.professorIds]
  if (!opts.ativo || professorIds.length === 0) return null
  const instId = opts.instituicaoId ?? (await resolverInstituicaoId())
  const res = await configuracoesRequests.associarProfessoresTurmaLote({
    instituicao_id: instId,
    turma_id: turmaId,
    professor_ids: professorIds,
    professor_titular_id: opts.titularProfessorId || professorIds[0],
  })
  return toastLoteParcial(res, "Professores associados à turma.")
}

export async function resolverInstituicaoId(instituicaoId?: string): Promise<string> {
  if (instituicaoId) return instituicaoId
  const inst = await configuracoesRequests.getMinhaInstituicao()
  return inst.id
}
