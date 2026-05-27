# Status de implementação

Documento **vivo** — atualizar a cada entrega que altere UI, API ou requisitos.

**Última revisão:** 2026-05-20 (integração frontend ↔ API E2E)  
**Legenda:** `Não iniciado` · `UI mock` · `API spec` · `Integrado` · `Concluído`

---

## Resumo executivo

| Métrica | Valor |
|---------|-------|
| Experiência professor (UI) | **Integrado** — módulos via API |
| Produto completo end-to-end | **~70%** — 5 perfis com login e rotas |
| Requisitos funcionais (24) | Parciais/Integrados conforme área |
| Endpoints API (~80) | **84 implementados** · **4 IA adiados** |
| Integração front↔API | **Em progresso E2E** — `lib/api`, BFF, cookies |

---

## Por área funcional

| Área | UI | API | Integração | Observação |
|------|-----|-----|------------|------------|
| Shell / tema / responsivo | Integrado | Concluído | Integrado | Nav por perfil, `/auth/me`, busca, notificações |
| Módulo Conteúdo | Integrado | Concluído | Integrado | `conteudoRequests` |
| Módulo Avaliações (professor) | Integrado | Concluído | Integrado | Provedor via API; IA UI local |
| Módulo Comunicados | Integrado | Concluído | Integrado | Inbox + criar/publicar |
| Dashboard AI | Integrado | Parcial | Integrado | Resumo API; gráficos ainda com seed local |
| Login + sessão | Concluído | Concluído | Integrado | `/login`, cookies, middleware |
| RBAC + rotas por perfil | Concluído | Concluído | Integrado | `middleware.ts` + `ProvedorAuth` |
| Configurações / cadastros | Concluído | Concluído | Integrado | `/configuracoes/*` |
| Super Admin | Concluído | Concluído | Integrado | `/super-admin/*` |
| Visão aluno (provas) | Concluído | Concluído | Integrado | `/aluno/provas` |
| Visão responsável | Integrado | Parcial | Integrado | Dashboard + comunicados |
| Backend (entidades) | — | Concluído | Concluído | F0 + 84 rotas |
| IA (chat/relatório) | UI parcial | API spec | Não iniciado | `IAController` pendente |

---

## Frontend — inventário

| Item | Status |
|------|--------|
| `lib/api/dtos/*` + `requests/*` | Concluído |
| `app/api/bff/[...path]` | Concluído |
| `middleware.ts` | Concluído |
| `lib/avaliacoes/dados.ts` | **Removido** |
| Mocks em módulos pedagógicos | **Removidos** (dashboard gráficos: seed local temporário) |

---

## Referências

- Integração: [12-integracao-frontend-api.md](./12-integracao-frontend-api.md)
- Roadmap: [11-roadmap-desenvolvimento.md](./11-roadmap-desenvolvimento.md)
- Contrato API: [07-api-contrato-backend.md](./07-api-contrato-backend.md)
