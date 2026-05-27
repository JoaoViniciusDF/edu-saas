"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { BlocoDocumento, DocumentoJson } from "@/lib/avaliacoes/documento"
import { documentoDeTexto } from "@/lib/avaliacoes/documento"

export function EditorDocumento({
  value,
  onChange,
  placeholder = "Texto do enunciado...",
}: {
  value: DocumentoJson | null | undefined
  onChange: (doc: DocumentoJson) => void
  placeholder?: string
}) {
  const texto = React.useMemo(() => {
    const p = value?.blocks?.find((b) => b.type === "paragraph")
    if (p && p.type === "paragraph" && typeof p.content === "string") return p.content
    return ""
  }, [value])

  const [modo, setModo] = React.useState<"simples" | "blocos">("simples")
  const [tituloBloco, setTituloBloco] = React.useState("")
  const [listaItens, setListaItens] = React.useState("")

  const atualizarTexto = (t: string) => {
    onChange(documentoDeTexto(t))
  }

  const adicionarBloco = (bloco: BlocoDocumento) => {
    const base = value ?? documentoDeTexto("")
    onChange({
      schema_version: "1.0",
      blocks: [...base.blocks, bloco],
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={modo === "simples" ? "default" : "outline"}
          onClick={() => setModo("simples")}
        >
          Texto
        </Button>
        <Button
          type="button"
          size="sm"
          variant={modo === "blocos" ? "default" : "outline"}
          onClick={() => setModo("blocos")}
        >
          Blocos
        </Button>
      </div>

      {modo === "simples" ? (
        <Textarea
          value={texto}
          onChange={(e) => atualizarTexto(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="rounded-xl"
        />
      ) : (
        <div className="space-y-2 rounded-xl border border-border/50 p-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Título (heading)"
              value={tituloBloco}
              onChange={(e) => setTituloBloco(e.target.value)}
              className="h-8 max-w-[200px]"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!tituloBloco.trim()}
              onClick={() => {
                adicionarBloco({ type: "heading", level: 2, content: tituloBloco.trim() })
                setTituloBloco("")
              }}
            >
              + Título
            </Button>
          </div>
          <Textarea
            placeholder="Itens da lista (um por linha)"
            value={listaItens}
            onChange={(e) => setListaItens(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!listaItens.trim()}
              onClick={() => {
                const items = listaItens.split("\n").map((s) => s.trim()).filter(Boolean)
                adicionarBloco({ type: "bulleted_list", items })
                setListaItens("")
              }}
            >
              + Lista
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                adicionarBloco({
                  type: "callout",
                  variant: "info",
                  content: "Instrução ou aviso para o aluno.",
                })
              }
            >
              + Callout
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => adicionarBloco({ type: "quote", content: "Citação de referência." })}
            >
              + Citação
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {value?.blocks?.length ?? 0} bloco(s). O JSON segue o padrão Docs/13 para uso pela IA.
          </p>
        </div>
      )}
    </div>
  )
}
