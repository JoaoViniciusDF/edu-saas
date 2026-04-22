export type StatusAvaliacao = "rascunho" | "publicada" | "encerrada"

export interface AvaliacaoListaItem {
  id: string
  titulo: string
  status: StatusAvaliacao
  alunosFeitos: number
  alunosTotal: number
}

export interface ConteudoAvaliacao {
  id: string
  nome: string
  alunosResponderam: number
  alunosTotal: number
  avaliacoesConcluidas: number
  avaliacoesTotal: number
  statusResumo: string
  avaliacoes: AvaliacaoListaItem[]
}

export interface AssuntoAvaliacao {
  id: string
  nome: string
  conteudos: ConteudoAvaliacao[]
}

export interface MateriaAvaliacao {
  id: string
  nome: string
  cor: string
  conteudosCount: number
  assuntos: AssuntoAvaliacao[]
}

export const dadosMaterias: MateriaAvaliacao[] = [
  {
    id: "mat",
    nome: "Matemática",
    cor: "from-blue-500 to-blue-600",
    conteudosCount: 4,
    assuntos: [
      {
        id: "mat_alg",
        nome: "Álgebra",
        conteudos: [
          {
            id: "9f422730-261f-4196-8f2a-e807d5f6bb20",
            nome: "Equações e funções",
            alunosResponderam: 22,
            alunosTotal: 30,
            avaliacoesConcluidas: 2,
            avaliacoesTotal: 3,
            statusResumo: "1 rascunho · 1 publicada · 1 encerrada",
            avaliacoes: [
              {
                id: "f1c90946-9a84-4318-b4d6-b8c2b7f7f57d",
                titulo: "Quiz: Funções (rascunho)",
                status: "rascunho",
                alunosFeitos: 0,
                alunosTotal: 30,
              },
              {
                id: "c2d3e391-e2b8-4846-ba87-7f01a0b0fe53",
                titulo: "Prova: Funções aplicadas",
                status: "publicada",
                alunosFeitos: 18,
                alunosTotal: 30,
              },
              {
                id: "2f8de84f-0350-4c47-b5ab-33387967afcf",
                titulo: "Geometria — encerrada",
                status: "encerrada",
                alunosFeitos: 30,
                alunosTotal: 30,
              },
            ],
          },
          {
            id: "7f0bdb5f-ab31-4308-938d-d02c530ccf13",
            nome: "Progressões",
            alunosResponderam: 12,
            alunosTotal: 30,
            avaliacoesConcluidas: 1,
            avaliacoesTotal: 2,
            statusResumo: "1 rascunho · 1 publicada",
            avaliacoes: [
              {
                id: "dd42d81c-a89d-4e8b-a5f9-41216afcef58",
                titulo: "PA e PG — rascunho",
                status: "rascunho",
                alunosFeitos: 0,
                alunosTotal: 30,
              },
              {
                id: "f2df77f1-c032-4359-89d4-6af2b5f68e7e",
                titulo: "Lista PA/PG",
                status: "publicada",
                alunosFeitos: 12,
                alunosTotal: 30,
              },
            ],
          },
        ],
      },
      {
        id: "mat_geo",
        nome: "Geometria",
        conteudos: [
          {
            id: "9ca628f7-c6dc-4257-b9f1-a40887adb80d",
            nome: "Figuras planas",
            alunosResponderam: 8,
            alunosTotal: 30,
            avaliacoesConcluidas: 0,
            avaliacoesTotal: 1,
            statusResumo: "1 rascunho",
            avaliacoes: [
              {
                id: "1bf35dfc-c0ca-47e5-8901-a570a8a9e8e6",
                titulo: "Classificação de polígonos",
                status: "rascunho",
                alunosFeitos: 0,
                alunosTotal: 30,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "fis",
    nome: "Física",
    cor: "from-violet-500 to-violet-600",
    conteudosCount: 2,
    assuntos: [
      {
        id: "fis_mec",
        nome: "Mecânica",
        conteudos: [
          {
            id: "a44ba11a-7d0b-4197-9d83-6a2a8a9aa9b5",
            nome: "Cinemática e dinâmica",
            alunosResponderam: 25,
            alunosTotal: 28,
            avaliacoesConcluidas: 1,
            avaliacoesTotal: 1,
            statusResumo: "1 publicada",
            avaliacoes: [
              {
                id: "3564313b-2ab2-4996-ab20-32e2e9465d15",
                titulo: "Newton em situações reais",
                status: "publicada",
                alunosFeitos: 25,
                alunosTotal: 28,
              },
            ],
          },
        ],
      },
    ],
  },
]

export function obterMateria(materiaId: string) {
  return dadosMaterias.find((materia) => materia.id === materiaId)
}

export function obterConteudoPorUuid(conteudoId: string) {
  for (const materia of dadosMaterias) {
    for (const assunto of materia.assuntos) {
      for (const conteudo of assunto.conteudos) {
        if (conteudo.id === conteudoId) {
          return { materia, assunto, conteudo }
        }
      }
    }
  }
  return null
}

export function obterContextoRota(materiaId: string, conteudoId: string) {
  const resultado = obterConteudoPorUuid(conteudoId)
  if (!resultado || resultado.materia.id !== materiaId) return null
  return resultado
}

export function obterAvaliacao(
  materiaId: string,
  conteudoId: string,
  avaliacaoId: string
) {
  const contexto = obterContextoRota(materiaId, conteudoId)
  if (!contexto) return null
  const avaliacao = contexto.conteudo.avaliacoes.find((item) => item.id === avaliacaoId)
  return avaliacao ? { ...contexto, avaliacao } : null
}
