"use client"

import * as React from "react"
import { FileCheck2, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Limite padrão: arquivos viram data URL embutida, então mantemos um teto razoável. */
export const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024 // 10 MB

export type ArquivoSelecionado = {
  nome: string
  tamanho: number
  mimeType: string
  /** Conteúdo do arquivo como data URL (base64), pronto para usar em src/href. */
  dataUrl: string
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo"))
    reader.readAsDataURL(file)
  })
}

interface DropzoneArquivoProps {
  /** Filtro do seletor de arquivos, ex.: "image/*", "application/pdf". */
  accept?: string
  /** Tamanho máximo em bytes. */
  tamanhoMaximo?: number
  arquivo: ArquivoSelecionado | null
  onArquivo: (arquivo: ArquivoSelecionado | null) => void
  /** Habilita o ouvinte global de colar (Ctrl+V) enquanto montado. */
  habilitarColar?: boolean
}

export function DropzoneArquivo({
  accept,
  tamanhoMaximo = TAMANHO_MAXIMO_ARQUIVO,
  arquivo,
  onArquivo,
  habilitarColar = true,
}: DropzoneArquivoProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)

  const processarArquivo = React.useCallback(
    async (file: File) => {
      setErro(null)
      if (file.size > tamanhoMaximo) {
        setErro(`Arquivo muito grande (máx. ${formatarTamanho(tamanhoMaximo)}).`)
        return
      }
      try {
        const dataUrl = await lerComoDataUrl(file)
        onArquivo({
          nome: file.name,
          tamanho: file.size,
          mimeType: file.type || "application/octet-stream",
          dataUrl,
        })
      } catch {
        setErro("Não foi possível ler o arquivo. Tente novamente.")
      }
    },
    [onArquivo, tamanhoMaximo]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processarArquivo(file)
  }

  React.useEffect(() => {
    if (!habilitarColar) return
    const handler = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0]
      if (file) {
        e.preventDefault()
        void processarArquivo(file)
      }
    }
    window.addEventListener("paste", handler)
    return () => window.removeEventListener("paste", handler)
  }, [habilitarColar, processarArquivo])

  if (arquivo) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{arquivo.nome}</p>
            <p className="text-xs text-muted-foreground">{formatarTamanho(arquivo.tamanho)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => {
              onArquivo(null)
              setErro(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
            aria-label="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void processarArquivo(file)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          arrastando
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">
          Arraste um arquivo, cole (Ctrl+V) ou{" "}
          <span className="text-primary underline underline-offset-2">clique para escolher</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Máximo {formatarTamanho(tamanhoMaximo)}
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void processarArquivo(file)
        }}
      />
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}
