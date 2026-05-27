"use client"

import type { DocumentoJson } from "@/lib/avaliacoes/documento"
import { cn } from "@/lib/utils"

export function RenderizadorDocumento({
  documento,
  className,
}: {
  documento: DocumentoJson | null | undefined
  className?: string
}) {
  if (!documento?.blocks?.length) return null

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {documento.blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const Tag = block.level <= 1 ? "h2" : block.level === 2 ? "h3" : "h4"
            return (
              <Tag key={i} className="font-semibold text-foreground">
                {block.content}
              </Tag>
            )
          }
          case "paragraph": {
            const texto =
              typeof block.content === "string"
                ? block.content
                : block.content.map((s) => s.text).join("")
            return (
              <p key={i} className="text-muted-foreground whitespace-pre-wrap">
                {texto}
              </p>
            )
          }
          case "bulleted_list":
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )
          case "numbered_list":
            return (
              <ol key={i} className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            )
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground"
              >
                {block.content}
              </blockquote>
            )
          case "callout":
            return (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-secondary/50 px-4 py-3 text-foreground"
              >
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {block.variant ?? "info"}
                </span>
                <p className="mt-1">{block.content}</p>
              </div>
            )
          case "divider":
            return <hr key={i} className="border-border/50" />
          case "image":
            return (
              <figure key={i} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.url} alt={block.caption ?? ""} className="max-w-full rounded-lg" />
                {block.caption && (
                  <figcaption className="text-xs text-muted-foreground">{block.caption}</figcaption>
                )}
              </figure>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
