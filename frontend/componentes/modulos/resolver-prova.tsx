"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RenderizadorDocumento } from "@/componentes/avaliacoes/renderizador-documento"
import type { DocumentoJson } from "@/lib/avaliacoes/documento"
import { alunoAvaliacoesRequests } from "@/lib/api/requests/avaliacoes"
import type { AlunoAvaliacaoView } from "@/lib/api/dtos/avaliacoes"

export function ResolverProva({ avaliacaoId }: { avaliacaoId: string }) {
  const router = useRouter()
  const [view, setView] = React.useState<AlunoAvaliacaoView | null>(null)
  const [submissaoId, setSubmissaoId] = React.useState<string | null>(null)
  const [respostas, setRespostas] = React.useState<
    Record<string, { indice?: number; texto?: string }>
  >({})
  const [enviando, setEnviando] = React.useState(false)

  React.useEffect(() => {
    alunoAvaliacoesRequests.getView(avaliacaoId).then((v) => {
      setView(v)
      setSubmissaoId(v.submissao_id ?? null)
    })
  }, [avaliacaoId])

  const garantirSubmissao = async () => {
    if (submissaoId) return submissaoId
    const sub = await alunoAvaliacoesRequests.createSubmissao(avaliacaoId)
    setSubmissaoId(sub.id)
    return sub.id
  }

  const salvarRespostas = async () => {
    const sid = await garantirSubmissao()
    if (!view) return
    await alunoAvaliacoesRequests.patchSubmissao(sid, {
      respostas: view.questoes.map((q) => ({
        questao_id: q.id,
        valor_texto: respostas[q.id]?.texto ?? null,
        indice_selecionado: respostas[q.id]?.indice ?? null,
      })),
    })
  }

  const enviar = async () => {
    setEnviando(true)
    try {
      await salvarRespostas()
      const sid = submissaoId ?? (await garantirSubmissao())
      await alunoAvaliacoesRequests.enviarSubmissao(sid)
      router.push("/aluno/provas")
    } finally {
      setEnviando(false)
    }
  }

  if (!view) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Carregando prova...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" className="rounded-xl gap-2" onClick={() => router.push("/aluno/provas")}>
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Button>
      <h1 className="text-2xl font-bold">{view.titulo}</h1>
      {view.questoes.map((q) => (
        <Card key={q.id} className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{q.ordem}.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.conteudo ? (
              <RenderizadorDocumento
                documento={q.conteudo as DocumentoJson}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{q.enunciado}</p>
            )}
            {q.tipo === "multipla_escolha" && q.alternativas ? (
              <RadioGroup
                value={String(respostas[q.id]?.indice ?? "")}
                onValueChange={(v) =>
                  setRespostas((prev) => ({
                    ...prev,
                    [q.id]: { indice: Number(v) },
                  }))
                }
              >
                {q.alternativas.map((alt, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <RadioGroupItem value={String(i)} id={`${q.id}-${i}`} />
                    <Label htmlFor={`${q.id}-${i}`}>{alt}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                className="rounded-xl"
                value={respostas[q.id]?.texto ?? ""}
                onChange={(e) =>
                  setRespostas((prev) => ({
                    ...prev,
                    [q.id]: { texto: e.target.value },
                  }))
                }
              />
            )}
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-3">
        <Button variant="outline" className="rounded-xl" onClick={() => void salvarRespostas()}>
          Salvar rascunho
        </Button>
        <Button className="rounded-xl gap-2" disabled={enviando} onClick={() => void enviar()}>
          <Send className="h-4 w-4" />
          Enviar prova
        </Button>
      </div>
    </div>
  )
}
