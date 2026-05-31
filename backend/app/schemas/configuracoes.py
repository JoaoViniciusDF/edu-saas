from datetime import date
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import SituacaoMatricula, TipoPerfil


class VisaoPlataforma(StrEnum):
    instituicoes = "instituicoes"
    professores = "professores"
    alunos = "alunos"
    turmas = "turmas"
    alunos_turma = "alunos_turma"
    professores_turma = "professores_turma"
    usuarios = "usuarios"


class InstituicaoResponse(BaseModel):
    id: UUID
    nome_fantasia: str
    documento_legal: str | None = None
    configuracoes: dict[str, Any] | None = None

    model_config = {"from_attributes": True}


class InstituicaoCreate(BaseModel):
    nome_fantasia: str = Field(min_length=1)
    documento_legal: str | None = None
    administrador_inicial: "AdministradorInicialCreate | None" = None


class AdministradorInicialCreate(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6)
    nome_exibicao: str = Field(min_length=1)


class InstituicaoPatch(BaseModel):
    nome_fantasia: str | None = None
    documento_legal: str | None = None
    configuracoes: dict[str, Any] | None = None


class SuperAdminResumo(BaseModel):
    total_instituicoes: int
    total_professores: int
    total_turmas: int
    total_alunos: int


class UsuarioInstituicaoItem(BaseModel):
    usuario_id: UUID
    email: str
    nome_exibicao: str
    perfil: TipoPerfil
    professor_id: UUID | None = None
    aluno_id: UUID | None = None
    responsavel_id: UUID | None = None


class InstituicaoResumoResponse(BaseModel):
    instituicao: InstituicaoResponse
    contagem_professores: int
    contagem_alunos: int
    contagem_turmas: int
    contagem_responsaveis: int
    contagem_administradores: int
    usuarios: list[UsuarioInstituicaoItem]


class UsuarioCreate(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6)
    nome_exibicao: str = Field(min_length=1)
    tipo_perfil: TipoPerfil
    instituicao_id: UUID | None = None
    registro_funcional: str | None = None
    areas_especialidade: str | None = None
    matricula_codigo: str | None = None
    data_nascimento: date | None = None
    grau_parentesco: str | None = None
    telefone: str | None = None


class UsuarioCreateResponse(BaseModel):
    usuario_id: UUID
    tipo_perfil: TipoPerfil
    email: str
    nome_exibicao: str
    instituicao_id: UUID | None = None
    professor_id: UUID | None = None
    aluno_id: UUID | None = None
    responsavel_id: UUID | None = None


class ProfessorListItem(BaseModel):
    id: UUID
    usuario_id: UUID
    nome_exibicao: str
    email: str
    registro_funcional: str | None = None
    instituicao_id: UUID | None = None
    instituicao_nome: str | None = None


class ProfessorCreate(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6)
    nome_exibicao: str = Field(min_length=1)
    registro_funcional: str | None = None
    areas_especialidade: str | None = None


class ProfessorPatch(BaseModel):
    nome_exibicao: str | None = None
    registro_funcional: str | None = None
    areas_especialidade: str | None = None


class AlunoListItem(BaseModel):
    id: UUID
    usuario_id: UUID
    nome_exibicao: str
    email: str
    matricula_codigo: str | None = None


class AlunoCreate(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6)
    nome_exibicao: str = Field(min_length=1)
    matricula_codigo: str | None = None
    data_nascimento: date | None = None


class AlunoPatch(BaseModel):
    nome_exibicao: str | None = None
    matricula_codigo: str | None = None
    data_nascimento: date | None = None


class ResponsavelListItem(BaseModel):
    id: UUID
    usuario_id: UUID
    nome_exibicao: str
    email: str
    grau_parentesco: str | None = None


class ResponsavelCreate(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6)
    nome_exibicao: str = Field(min_length=1)
    grau_parentesco: str | None = None
    telefone: str | None = None


class ResponsavelPatch(BaseModel):
    nome_exibicao: str | None = None
    grau_parentesco: str | None = None
    telefone: str | None = None


class VinculoResponsavelCreate(BaseModel):
    responsavel_id: UUID
    responsavel_principal: bool = False


class TurmaResumoItem(BaseModel):
    id: UUID
    nome: str
    ano_letivo: str
    turno: str | None = None


class TurmaListItem(BaseModel):
    id: UUID
    nome: str
    ano_letivo: str
    turno: str | None = None
    professor_titular_id: UUID | None = None
    professor_titular_nome: str | None = None
    instituicao_id: UUID | None = None
    instituicao_nome: str | None = None
    contagem_alunos: int | None = None


class DiretorioPlataformaItem(BaseModel):
    id: UUID
    tipo: str
    nome: str
    email: str | None = None
    perfil: TipoPerfil | None = None
    instituicao_id: UUID | None = None
    instituicao_nome: str | None = None
    documento_legal: str | None = None
    matricula_codigo: str | None = None
    registro_funcional: str | None = None
    ano_letivo: str | None = None
    turno: str | None = None
    professor_titular_nome: str | None = None
    contagem_alunos: int | None = None
    contagem_professores: int | None = None
    contagem_turmas: int | None = None
    turmas: list[TurmaResumoItem] | None = None
    usuario_id: UUID | None = None
    professor_id: UUID | None = None
    aluno_id: UUID | None = None


class DiretorioPlataformaResponse(BaseModel):
    items: list[DiretorioPlataformaItem]
    total: int


class AlunoDetalheResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    nome_exibicao: str
    email: str
    matricula_codigo: str | None = None
    data_nascimento: date | None = None
    nome_social: str | None = None
    instituicao: InstituicaoResponse | None = None
    turmas: list[TurmaResumoItem]
    responsaveis: list["ResponsavelVinculoItem"]


class ProfessorDetalheResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    nome_exibicao: str
    email: str
    registro_funcional: str | None = None
    areas_especialidade: str | None = None
    instituicao: InstituicaoResponse | None = None
    turmas_titulares: list[TurmaResumoItem]


class TurmaCreate(BaseModel):
    nome: str = Field(min_length=1)
    ano_letivo: str = Field(min_length=1)
    turno: str | None = None
    professor_titular_id: UUID | None = None


class TurmaPatch(BaseModel):
    nome: str | None = None
    ano_letivo: str | None = None
    turno: str | None = None
    professor_titular_id: UUID | None = None


class MatriculaCreate(BaseModel):
    aluno_id: UUID
    turma_id: UUID
    data_inicio: date


class MatriculaPatch(BaseModel):
    situacao: SituacaoMatricula | None = None
    data_fim: date | None = None


class MatriculaResponse(BaseModel):
    id: UUID
    aluno_id: UUID
    turma_id: UUID
    data_inicio: date
    data_fim: date | None = None
    situacao: SituacaoMatricula


class ResponsavelVinculoItem(BaseModel):
    id: UUID
    nome_exibicao: str
    grau_parentesco: str | None = None
    responsavel_principal: bool


InstituicaoCreate.model_rebuild()
