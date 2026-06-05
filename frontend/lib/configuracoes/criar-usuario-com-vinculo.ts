import type { UsuarioCreate, UsuarioCreateResponse } from "@/lib/api/dtos/configuracoes"
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { ApiError } from "@/lib/api/errors"
import type { ContraparteNovaForm, ModoVinculo, VinculoAlunoResponsavelState } from "@/componentes/shared/wizard-passo-vinculo-aluno-responsavel"

export type ExecutarCriacaoComVinculoParams = {
  modo: ModoVinculo
  principal: UsuarioCreate
  vinculo: VinculoAlunoResponsavelState
  instituicaoId?: string
}

async function vincularAlunoResponsavel(
  alunoId: string,
  responsavelId: string,
  responsavelPrincipal: boolean,
  instituicaoId?: string
) {
  if (instituicaoId) {
    await configuracoesRequests.vincularResponsavelAlunosLote({
      instituicao_id: instituicaoId,
      responsavel_id: responsavelId,
      aluno_ids: [alunoId],
      responsavel_principal: responsavelPrincipal,
    })
  } else {
    await configuracoesRequests.vincularResponsavel(alunoId, {
      responsavel_id: responsavelId,
      responsavel_principal: responsavelPrincipal,
    })
  }
}

function contraparteParaUsuarioCreate(
  modo: ModoVinculo,
  form: ContraparteNovaForm,
  instituicaoId?: string
): UsuarioCreate {
  if (modo === "aluno") {
    return {
      tipo_perfil: "responsavel",
      instituicao_id: instituicaoId,
      nome_exibicao: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      senha: form.senha,
      grau_parentesco: form.grauParentesco.trim() || undefined,
      telefone: form.telefone.trim() || undefined,
    }
  }
  return {
    tipo_perfil: "aluno",
    instituicao_id: instituicaoId,
    nome_exibicao: form.nome.trim(),
    email: form.email.trim().toLowerCase(),
    senha: form.senha,
    matricula_codigo: form.matricula.trim() || undefined,
  }
}

export class CriacaoParcialError extends Error {
  constructor(
    message: string,
    readonly parcial?: UsuarioCreateResponse
  ) {
    super(message)
    this.name = "CriacaoParcialError"
  }
}

export async function executarCriacaoComVinculo({
  modo,
  principal,
  vinculo,
  instituicaoId,
}: ExecutarCriacaoComVinculoParams): Promise<UsuarioCreateResponse> {
  let parcial: UsuarioCreateResponse | undefined

  try {
    if (modo === "aluno") {
      const alunoRes = await configuracoesRequests.createUsuario(principal)
      parcial = alunoRes
      const alunoId = alunoRes.aluno_id
      if (!alunoId) throw new Error("Resposta sem aluno_id")

      let responsavelId = vinculo.contraparteId
      if (!vinculo.vinculoExistente) {
        const nova = contraparteParaUsuarioCreate(modo, vinculo.getContraparteNova(), instituicaoId)
        const respRes = await configuracoesRequests.createUsuario(nova)
        responsavelId = respRes.responsavel_id ?? ""
        if (!responsavelId) throw new CriacaoParcialError("Resposta sem responsavel_id", alunoRes)
      }

      await vincularAlunoResponsavel(
        alunoId,
        responsavelId,
        vinculo.responsavelPrincipal,
        instituicaoId
      )
      return alunoRes
    }

    let alunoId = vinculo.contraparteId
    if (!vinculo.vinculoExistente) {
      const nova = contraparteParaUsuarioCreate(modo, vinculo.getContraparteNova(), instituicaoId)
      const alunoRes = await configuracoesRequests.createUsuario(nova)
      parcial = alunoRes
      alunoId = alunoRes.aluno_id ?? ""
      if (!alunoId) throw new Error("Resposta sem aluno_id")
    }

    const respRes = await configuracoesRequests.createUsuario(principal)
    parcial = respRes
    const responsavelId = respRes.responsavel_id
    if (!responsavelId) {
      throw new CriacaoParcialError("Resposta sem responsavel_id", parcial)
    }

    await vincularAlunoResponsavel(
      alunoId,
      responsavelId,
      vinculo.responsavelPrincipal,
      instituicaoId
    )
    return respRes
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 409) {
      throw new Error("Este vínculo entre aluno e responsável já existe.")
    }
    if (e instanceof CriacaoParcialError) {
      throw new CriacaoParcialError(
        `${e.message} O cadastro principal pode ter sido criado; verifique a lista antes de tentar de novo.`,
        e.parcial
      )
    }
    if (parcial) {
      throw new CriacaoParcialError(
        "Falha ao concluir o vínculo. Um dos cadastros pode ter sido criado; verifique a lista.",
        parcial
      )
    }
    throw e
  }
}
