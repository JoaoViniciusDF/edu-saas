/** Tipos espelhando backend/app/schemas/documento.py */

export type BlocoDocumento =
  | { type: "heading"; level: number; content: string }
  | { type: "paragraph"; content: string | { text: string; bold?: boolean; italic?: boolean }[] }
  | { type: "bulleted_list" | "numbered_list"; items: string[] }
  | { type: "quote"; content: string }
  | { type: "callout"; variant?: "info" | "warning" | "tip"; content: string }
  | { type: "divider" }
  | { type: "image"; url: string; caption?: string }

export interface DocumentoJson {
  schema_version: string
  blocks: BlocoDocumento[]
}

export function documentoDeTexto(texto: string): DocumentoJson {
  const t = texto.trim()
  if (!t) return { schema_version: "1.0", blocks: [] }
  return { schema_version: "1.0", blocks: [{ type: "paragraph", content: t }] }
}

export function textoDeDocumento(doc: DocumentoJson | null | undefined): string {
  if (!doc?.blocks?.length) return ""
  return doc.blocks
    .map((b) => {
      if (b.type === "heading" || b.type === "quote" || b.type === "callout") return b.content
      if (b.type === "paragraph") {
        return typeof b.content === "string"
          ? b.content
          : b.content.map((s) => s.text).join("")
      }
      if (b.type === "bulleted_list" || b.type === "numbered_list") return b.items.join("\n")
      return ""
    })
    .filter(Boolean)
    .join("\n")
}
