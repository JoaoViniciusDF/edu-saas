import { bffRequest } from "../client"
import type {
  MaterialCreate,
  MaterialPatch,
  MaterialResponse,
  PastaConteudoCreate,
  PastaConteudoPatch,
  PastaConteudoResponse,
  PresignRequest,
  PresignResponse,
} from "../dtos/conteudo"

export const conteudoRequests = {
  listPastas: () => bffRequest<PastaConteudoResponse[]>("/conteudo/consultar-pastas"),
  createPasta: (body: PastaConteudoCreate) =>
    bffRequest<PastaConteudoResponse>("/conteudo/criar-pasta", { method: "POST", body }),
  patchPasta: (id: string, body: PastaConteudoPatch) =>
    bffRequest<PastaConteudoResponse>(`/conteudo/editar-pasta/${id}`, { method: "PUT", body }),
  deletePasta: (id: string) =>
    bffRequest<void>(`/conteudo/apagar-pasta/${id}`, { method: "DELETE" }),
  listMateriais: (pastaId: string) =>
    bffRequest<MaterialResponse[]>(`/conteudo/consultar-materiais/${pastaId}`),
  createMaterial: (pastaId: string, body: MaterialCreate) =>
    bffRequest<MaterialResponse>(`/conteudo/criar-material/${pastaId}`, {
      method: "POST",
      body,
    }),
  getMaterial: (id: string) =>
    bffRequest<MaterialResponse>(`/conteudo/consultar-material/${id}`),
  patchMaterial: (id: string, body: MaterialPatch) =>
    bffRequest<MaterialResponse>(`/conteudo/editar-material/${id}`, { method: "PUT", body }),
  deleteMaterial: (id: string) =>
    bffRequest<void>(`/conteudo/apagar-material/${id}`, { method: "DELETE" }),
  presign: (body: PresignRequest) =>
    bffRequest<PresignResponse>("/conteudo/gerar-url-upload", { method: "POST", body }),
}
