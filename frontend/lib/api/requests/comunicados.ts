import { bffRequest } from "../client"
import type {
  ComunicadoCreate,
  ComunicadoDetail,
  ComunicadoListItem,
  ComunicadoPatch,
} from "../dtos/comunicados"

export const comunicadosRequests = {
  list: () => bffRequest<ComunicadoListItem[]>("/comunicados"),
  get: (id: string) => bffRequest<ComunicadoDetail>(`/comunicados/${id}`),
  create: (body: ComunicadoCreate) =>
    bffRequest<ComunicadoDetail>("/comunicados", { method: "POST", body }),
  patch: (id: string, body: ComunicadoPatch) =>
    bffRequest<ComunicadoDetail>(`/comunicados/${id}`, { method: "PATCH", body }),
  publicar: (id: string) =>
    bffRequest<ComunicadoDetail>(`/comunicados/${id}/publicar`, { method: "POST" }),
  marcarLido: (id: string) =>
    bffRequest<void>(`/comunicados/${id}/marcar-lido`, { method: "POST" }),
}
