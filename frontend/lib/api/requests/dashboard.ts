import { bffRequest } from "../client"
import type {
  DashboardQueryParams,
  DashboardResumo,
  DashboardSeriesResponse,
  NotificacaoItem,
  SearchHit,
} from "../dtos/dashboard"

export const dashboardRequests = {
  resumo: (params?: DashboardQueryParams) =>
    bffRequest<DashboardResumo>("/dashboard/resumo", { searchParams: params }),
  series: (params?: Omit<DashboardQueryParams, "escopo">) =>
    bffRequest<DashboardSeriesResponse>("/dashboard/series", { searchParams: params }),
  search: (q: string, types?: string) =>
    bffRequest<SearchHit[]>("/search", {
      searchParams: { q, ...(types ? { types } : {}) },
    }),
  notificacoes: () => bffRequest<NotificacaoItem[]>("/notificacoes"),
  marcarNotificacaoLida: (id: string) =>
    bffRequest<void>(`/notificacoes/${id}/lida`, { method: "PATCH" }),
  marcarTodasLidas: () =>
    bffRequest<void>("/notificacoes/marcar-todas-lidas", { method: "POST" }),
}
