"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BookOpen, FileText, Headphones, Image, StickyNote, Video } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ModalWizardShell,
  WizardCardOption,
  WizardResumo,
  WizardResumoLinha,
} from "@/components/ui/modal-wizard-shell"
import { DropzoneArquivo, type ArquivoSelecionado } from "@/componentes/shared/dropzone-arquivo"
import { conteudoRequests } from "@/lib/api/requests/conteudo"
import type { TipoAnexoMaterial } from "@/lib/api/dtos/common"
import { queryKeys } from "@/lib/cache/query-keys"

const TIPOS: { value: TipoAnexoMaterial; label: string; icone: typeof FileText }[] = [
  { value: "nota", label: "Nota", icone: StickyNote },
  { value: "pdf", label: "PDF", icone: FileText },
  { value: "video", label: "Vídeo", icone: Video },
  { value: "audio", label: "Áudio", icone: Headphones },
  { value: "imagem", label: "Imagem", icone: Image },
]

const ACEITE_POR_TIPO: Record<TipoAnexoMaterial, string | undefined> = {
  nota: undefined,
  pdf: "application/pdf",
  video: "video/*",
  audio: "audio/*",
  imagem: "image/*",
}

interface Props {
  pastaId: string
  nomePasta: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

export function ModalCriarMaterialWizard({ pastaId, nomePasta, aberto, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [etapa, setEtapa] = React.useState(0)
  const [tipo, setTipo] = React.useState<TipoAnexoMaterial>("nota")
  const [titulo, setTitulo] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [corpo, setCorpo] = React.useState("")
  const [arquivo, setArquivo] = React.useState<ArquivoSelecionado | null>(null)
  const [salvando, setSalvando] = React.useState(false)

  const reset = () => {
    setEtapa(0)
    setTipo("nota")
    setTitulo("")
    setDescricao("")
    setCorpo("")
    setArquivo(null)
  }

  const podeAvancar = () => {
    if (etapa === 0) return !!tipo
    if (etapa === 1) return !!titulo.trim() && (tipo === "nota" || !!arquivo)
    return true
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      await conteudoRequests.createMaterial(pastaId, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tipo_anexo: tipo,
        corpo_texto: tipo === "nota" ? corpo.trim() || null : null,
        url_objeto: tipo !== "nota" ? arquivo?.dataUrl ?? null : null,
      })
      toast.success("Material criado!")
      void qc.invalidateQueries({ queryKey: queryKeys.conteudo.materiais(pastaId) })
      reset()
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Novo material"
      etapas={["Tipo", "Dados", "Confirmar"]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={podeAvancar()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Criar material"
      icone={BookOpen}
      onReset={reset}
    >
      {etapa === 0 && (
        <div className="grid grid-cols-2 gap-3">
          {TIPOS.map((t) => (
            <WizardCardOption
              key={t.value}
              selecionado={tipo === t.value}
              onClick={() => setTipo(t.value)}
              icone={t.icone}
              label={t.label}
            />
          ))}
        </div>
      )}

      {etapa === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Pasta: {nomePasta}</p>
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="rounded-xl" />
          </div>
          {tipo === "nota" ? (
            <div className="space-y-2">
              <Label>Conteúdo da nota</Label>
              <Textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} className="rounded-xl min-h-[100px]" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <DropzoneArquivo
                accept={ACEITE_POR_TIPO[tipo]}
                arquivo={arquivo}
                onArquivo={setArquivo}
                habilitarColar={aberto && etapa === 1}
              />
            </div>
          )}
        </div>
      )}

      {etapa === 2 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Pasta" valor={nomePasta} />
          <WizardResumoLinha rotulo="Tipo" valor={TIPOS.find((t) => t.value === tipo)?.label ?? tipo} />
          <WizardResumoLinha rotulo="Título" valor={titulo} />
          {tipo !== "nota" && arquivo && (
            <WizardResumoLinha rotulo="Arquivo" valor={arquivo.nome} />
          )}
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}

export function ModalEditarMaterialWizard({
  materialId,
  pastaId,
  tituloInicial,
  descricaoInicial,
  corpoInicial,
  aberto,
  onOpenChange,
}: {
  materialId: string
  pastaId: string
  tituloInicial: string
  descricaoInicial: string
  corpoInicial?: string
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}) {
  const qc = useQueryClient()
  const [etapa, setEtapa] = React.useState(0)
  const [titulo, setTitulo] = React.useState(tituloInicial)
  const [descricao, setDescricao] = React.useState(descricaoInicial)
  const [corpo, setCorpo] = React.useState(corpoInicial ?? "")
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (aberto) {
      setTitulo(tituloInicial)
      setDescricao(descricaoInicial)
      setCorpo(corpoInicial ?? "")
      setEtapa(0)
    }
  }, [aberto, tituloInicial, descricaoInicial, corpoInicial])

  const salvar = async () => {
    setSalvando(true)
    try {
      await conteudoRequests.patchMaterial(materialId, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        corpo_texto: corpo.trim() || null,
      })
      toast.success("Material atualizado!")
      void qc.invalidateQueries({ queryKey: queryKeys.conteudo.materiais(pastaId) })
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalWizardShell
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Editar material"
      etapas={["Dados", "Confirmar"]}
      etapaAtual={etapa}
      onEtapaAnterior={() => setEtapa((e) => e - 1)}
      onEtapaProxima={() => setEtapa((e) => e + 1)}
      podeAvancar={!!titulo.trim()}
      onSubmit={salvar}
      salvando={salvando}
      textoSubmit="Salvar"
      icone={BookOpen}
    >
      {etapa === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="rounded-xl" />
          </div>
          {corpoInicial !== undefined && (
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea value={corpo} onChange={(e) => setCorpo(e.target.value)} className="rounded-xl min-h-[100px]" />
            </div>
          )}
        </div>
      )}
      {etapa === 1 && (
        <WizardResumo>
          <WizardResumoLinha rotulo="Título" valor={titulo} />
          {descricao && <WizardResumoLinha rotulo="Descrição" valor={descricao} />}
        </WizardResumo>
      )}
    </ModalWizardShell>
  )
}
