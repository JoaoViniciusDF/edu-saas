import { bffRequest } from "../client"
import type {
  ComunicadoCreate,
  ComunicadoDetail,
  ComunicadoListItem,
  ComunicadoPatch,
} from "../dtos/comunicados"

export const comunicadosRequests = {
  list: () => bffRequest<ComunicadoListItem[]>("/comunicados/consultar-comunicados"),
  get: (id: string) => bffRequest<ComunicadoDetail>(`/comunicados/consultar-comunicado/${id}`),
  create: (body: ComunicadoCreate) =>
    bffRequest<ComunicadoDetail>("/comunicados/criar-comunicado", { method: "POST", body }),
  patch: (id: string, body: ComunicadoPatch) =>
    bffRequest<ComunicadoDetail>(`/comunicados/editar-comunicado/${id}`, { method: "PUT", body }),
  publicar: (id: string) =>
    bffRequest<ComunicadoDetail>(`/comunicados/publicar-comunicado/${id}`, { method: "POST" }),
  marcarLido: (id: string) =>
    bffRequest<void>(`/comunicados/marcar-comunicado-lido/${id}`, { method: "POST" }),
}
