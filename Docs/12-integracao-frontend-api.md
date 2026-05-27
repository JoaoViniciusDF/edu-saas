# Integração frontend ↔ API

**Versão:** 1.0  
**Base URL:** `NEXT_PUBLIC_API_URL` + `/api/v1`  
**Contrato REST:** [07-api-contrato-backend.md](./07-api-contrato-backend.md)

---

## Mapa controller → `frontend/lib/api`

| Controller backend | DTOs (`lib/api/dtos/`) | Requests (`lib/api/requests/`) |
|--------------------|------------------------|--------------------------------|
| `ConfiguracoesController` | `configuracoes.ts`, `auth.ts` | `configuracoes.ts` |
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
| `edu_refresh` | Refresh token — rota `/api/auth/refresh` |

Route Handlers Next.js (`app/api/auth/*`) fazem proxy para o backend e setam cookies. O browser chama `/api/auth/login`; módulos usam `apiClient` que lê sessão via mesmas rotas ou header injetado no client.

---

## Convenções

- **Erros:** envelope `{ code, message, details? }` → classe `ApiError`
- **Paginação:** `PaginatedResponse<T>` com `items`, `next_cursor`, `has_more`
- **IDs:** UUID string no JSON
- **DTOs:** somente tipos TypeScript; fetch apenas em `requests/*`

---

## Matriz rota × perfil (middleware + guard)

| Prefixo | super_admin | administrador | professor | aluno | responsavel |
|---------|:-----------:|:-------------:|:---------:|:-----:|:-----------:|
| `/super-admin` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/configuracoes` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/conteudo`, `/avaliacoes`, `/comunicados`, `/dashboard` | ❌ | ✅ | ✅ | ❌ | parcial* |
| `/aluno` | ❌ | ❌ | ❌ | ✅ | ❌ |

\* Responsável: apenas `/dashboard` e `/comunicados`.

---

## Ordem de implementação

1. `lib/api` + Route Handlers auth  
2. `middleware.ts` + `ProvedorAuth`  
3. `/login` + shell (cabeçalho, sidebar)  
4. `/configuracoes`, `/super-admin`  
5. Módulos pedagógicos (remover mocks)  
6. `(aluno)/` + smoke 5 perfis seed  

---

## Referências

- Roteamento pós-login: [03-dominio-entidades-e-rbac.md](./03-dominio-entidades-e-rbac.md)
- Telas: [06-modulos-interface-por-perfil.md](./06-modulos-interface-por-perfil.md)
- Status: [10-status-implementacao.md](./10-status-implementacao.md)
