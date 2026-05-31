# Integração frontend ↔ API

**Versão:** 2.0  
**Base URL:** `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:8000`) — **sem** `/api/v1`  
**Contrato REST:** [07-api-contrato-backend.md](./07-api-contrato-backend.md)

---

## Mapa controller → `frontend/lib/api`

| Controller backend | DTOs (`lib/api/dtos/`) | Requests (`lib/api/requests/`) |
|--------------------|------------------------|--------------------------------|
| `ConfiguracoesController` | `configuracoes.ts`, `auth.ts` | `configuracoes.ts` (`configuracoesRequests`) |
| `AvaliacoesController` | `avaliacoes.ts` | `avaliacoes.ts` |
| `ConteudoController` | `conteudo.ts` | `conteudo.ts` |
| `ComunicadosController` | `comunicados.ts` | `comunicados.ts` |
| `DashboardController` | `dashboard.ts` | `dashboard.ts` |

Transversal: `client.ts`, `errors.ts`, `session.ts`, `dtos/common.ts`.

---

## Sessão (cookies httpOnly)

| Cookie | Uso |
|--------|-----|
| `edu_access` | JWT access — enviado ao FastAPI via Route Handlers BFF |
| `edu_refresh` | Refresh token — rota `/api/auth/refresh` → backend `/configuracoes/renovar-token` |

Route Handlers Next.js (`app/api/auth/*`) fazem proxy para o backend e setam cookies. O browser chama `/api/auth/login` (proxy para `/configuracoes/autenticar`); módulos usam `bffRequest` via `/api/bff/*`.

---

## Convenções v2

- **Paths:** verbo-recurso em português (`/configuracoes/consultar-alunos`, `/avaliacoes/criar-materia`)
- **Atualizações:** sempre `PUT` (sem `PATCH`)
- **Erros:** envelope `{ code, message, details? }` → classe `ApiError`
- **Paginação:** `PaginatedResponse<T>` com `items`, `next_cursor`, `has_more`
- **IDs:** UUID string no JSON
- **DTOs:** somente tipos TypeScript; fetch apenas em `requests/*`

---

## Exemplos de chamada (BFF)

```typescript
import { configuracoesRequests } from "@/lib/api/requests/configuracoes"
import { avaliacoesRequests } from "@/lib/api/requests/avaliacoes"

await configuracoesRequests.listTurmas()
await avaliacoesRequests.listMaterias()
await dashboardRequests.resumo()
```

Backend direto (Route Handlers):

```typescript
await apiRequest("/configuracoes/autenticar", { method: "POST", body })
await apiRequest("/configuracoes/consultar-perfil", { token })
```

---

## Healthcheck

`GET http://localhost:8000/health` — retorna `status`, `database`, `latency_ms`, `version`. HTTP **503** se banco indisponível.

---

## Referências

- Roteamento pós-login: [03-dominio-entidades-e-rbac.md](./03-dominio-entidades-e-rbac.md)
- Telas: [06-modulos-interface-por-perfil.md](./06-modulos-interface-por-perfil.md)
- Migração v1→v2: [07-api-contrato-backend.md](./07-api-contrato-backend.md) § 8
