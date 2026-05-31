import type { TipoPerfilUsuario, VisaoPlataforma } from "@/lib/api/dtos/configuracoes"

export const LABEL_VISAO: Record<VisaoPlataforma, string> = {
  instituicoes: "Instituições",
  professores: "Professores",
  alunos: "Alunos",
  turmas: "Turmas",
  alunos_turma: "Alunos por turma",
  professores_turma: "Professores por turma",
  usuarios: "Usuários",
}

export const LABEL_PERFIL: Record<TipoPerfilUsuario, string> = {
  super_admin: "Super Admin",
  administrador: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
  responsavel: "Responsável",
}

export const COR_PERFIL: Record<TipoPerfilUsuario, string> = {
  super_admin: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  administrador: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  professor: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  aluno: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  responsavel: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

export const VISAO_OPCOES_HOME: VisaoPlataforma[] = ["instituicoes", "usuarios"]

export const VISAO_OPCOES: VisaoPlataforma[] = [
  "instituicoes",
  "professores",
  "alunos",
  "turmas",
  "alunos_turma",
  "professores_turma",
  "usuarios",
]
