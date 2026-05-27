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
  listPastas: () => bffRequest<PastaConteudoResponse[]>("/conteudo/pastas"),
  createPasta: (body: PastaConteudoCreate) =>
    bffRequest<PastaConteudoResponse>("/conteudo/pastas", { method: "POST", body }),
  patchPasta: (id: string, body: PastaConteudoPatch) =>
    bffRequest<PastaConteudoResponse>(`/conteudo/pastas/${id}`, { method: "PATCH", body }),
  deletePasta: (id: string) =>
    bffRequest<void>(`/conteudo/pastas/${id}`, { method: "DELETE" }),
  listMateriais: (pastaId: string) =>
    bffRequest<MaterialResponse[]>(`/conteudo/pastas/${pastaId}/materiais`),
  createMaterial: (pastaId: string, body: MaterialCreate) =>
    bffRequest<MaterialResponse>(`/conteudo/pastas/${pastaId}/materiais`, {
      method: "POST",
      body,
    }),
  getMaterial: (id: string) => bffRequest<MaterialResponse>(`/conteudo/materiais/${id}`),
  patchMaterial: (id: string, body: MaterialPatch) =>
    bffRequest<MaterialResponse>(`/conteudo/materiais/${id}`, { method: "PATCH", body }),
  deleteMaterial: (id: string) =>
    bffRequest<void>(`/conteudo/materiais/${id}`, { method: "DELETE" }),
  presign: (body: PresignRequest) =>
    bffRequest<PresignResponse>("/uploads/presign", { method: "POST", body }),
}
