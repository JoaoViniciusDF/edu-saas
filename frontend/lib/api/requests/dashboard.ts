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
    bffRequest<DashboardResumo>("/dashboard/consultar-resumo", { searchParams: params }),
  series: (params?: Omit<DashboardQueryParams, "escopo">) =>
    bffRequest<DashboardSeriesResponse>("/dashboard/consultar-series", { searchParams: params }),
  search: (q: string, types?: string) =>
    bffRequest<SearchHit[]>("/dashboard/buscar", {
      searchParams: { q, ...(types ? { types } : {}) },
    }),
  notificacoes: () => bffRequest<NotificacaoItem[]>("/dashboard/consultar-notificacoes"),
  marcarNotificacaoLida: (id: string) =>
    bffRequest<void>(`/dashboard/marcar-notificacao-lida/${id}`, { method: "PUT" }),
  marcarTodasLidas: () =>
    bffRequest<void>("/dashboard/marcar-todas-notificacoes-lidas", { method: "POST" }),
}
