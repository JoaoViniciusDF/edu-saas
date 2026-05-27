# Requisitos funcionais e não funcionais

Legenda de status:

| Status | Significado |
|--------|-------------|
| `Não iniciado` | Sem implementação |
| `UI mock` | Interface com dados locais/mock |
| `API spec` | Documentado em [07-api-contrato-backend.md](./07-api-contrato-backend.md), sem código |
| `Integrado` | Front + back funcionando |
| `Concluído` | Aceite atendido em ambiente de demonstração |

---

## Requisitos funcionais (RF)

### RF-001 — Cabeçalho global

| Campo | Valor |
|-------|--------|
| Subsistema | Global / Cabeçalho |
| Descrição | Barra superior com busca unificada, notificações, alternador de tema e menu de perfil com identidade autenticada |
| Status UI | `UI mock` — busca sem handler; notificações mock; perfil fixo "Maria Silva" |
| Status API | `API spec` — `/search`, `/notificacoes*`, `/auth/me`, `/users/me/preferences` |
| Critério de aceite | Usuário autenticado vê seus dados reais; busca retorna grupos por tipo; tema persiste via preferências |
| Fase roadmap | F1 (perfil), F8 (busca/notificações) |

### RF-002 — Controle de acesso (RBAC)

| Campo | Valor |
|-------|--------|
| Subsistema | Segurança |
| Descrição | API impede mutações por aluno e responsável, exceto submissão própria e leitura de comunicados |
| Status UI | `Não iniciado` |
| Status API | `API spec` |
| Critério de aceite | Testes de integração retornam 403 em mutações indevidas por perfil |
| Fase roadmap | F1 |

### RF-003 — Conteúdo por disciplina e tipos de anexo

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Conteúdo |
| Descrição | Materiais em pastas de disciplina; tipos PDF, áudio, imagem, vídeo, nota; modal de visualização |
| Status UI | `UI mock` — [`modulo-conteudo.tsx`](../frontend/componentes/modulos/modulo-conteudo.tsx) |
| Status API | `API spec` — `/conteudo/*`, `/uploads/presign` |
| Critério de aceite | Material persiste; modal exibe metadados coerentes com tipo |
| Fase roadmap | F4 |

### RF-004 — Filtros e busca no conteúdo

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Conteúdo |
| Descrição | Filtros/busca restringem lista ao contexto da pasta ou termo |
| Status UI | `UI mock` — filtro local |
| Status API | `API spec` — query `tipo` em materiais; `/search` |
| Critério de aceite | Lista reflete filtros no servidor |
| Fase roadmap | F4, F8 |

### RF-005 — Hierarquia e estados de avaliação

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Avaliações |
| Descrição | Navegação Matéria → Assunto → Pasta → Avaliações com estados rascunho/publicada/encerrada |
| Status UI | `UI mock` — rotas e [`avaliacoes-provedor.tsx`](../frontend/componentes/modulos/avaliacoes-provedor.tsx) |
| Status API | `API spec` |
| Critério de aceite | Estados visíveis e consistentes com banco |
| Fase roadmap | F3 |

### RF-006 — Editor com assistente (sidecar)

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Avaliações |
| Descrição | Painel de questões + painel conversacional para coautoria |
| Status UI | `UI mock` — respostas canned com `setTimeout` |
| Status API | `API spec` — `/avaliacoes/.../chat` |
| Critério de aceite | Mensagens persistem; professor único autorizado |
| Fase roadmap | F3 (persistência); LLM real pós-MVP ou stub |

### RF-007 — Auto-save de rascunho

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Avaliações |
| Descrição | Salvamento automático com debounce; recuperação após falha |
| Status UI | `Não iniciado` (salvar manual implícito no mock) |
| Status API | `API spec` — `POST .../salvar-rascunho` |
| Critério de aceite | Debounce no front; idempotência no back; sem perda em refresh |
| Fase roadmap | F3 |

### RF-008 — Criar matéria, assunto e pasta

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Avaliações |
| Descrição | Diálogos criam entidades com IDs estáveis para rotas |
| Status UI | `UI mock` — contexto local |
| Status API | `API spec` |
| Critério de aceite | POST cria assunto "Geral" padrão ao criar matéria |
| Fase roadmap | F3 |

### RF-009 — Bloqueio pós-prazo/encerrada

| Campo | Valor |
|-------|--------|
| Subsistema | Módulo Avaliações |
| Descrição | Servidor rejeita submissão após encerramento ou prazo UTC |
| Status UI | `UI mock` — sem validação servidor |
| Status API | `API spec` |
| Critério de aceite | `POST .../enviar` retorna 403 quando inválido |
| Fase roadmap | F3, F5 |

### RF-010 — Comunicado segmentado

| Campo | Valor |
|-------|--------|
| Subsistema | Comunicados |
| Descrição | Público explícito alunos e/ou responsáveis; fora do escopo não vê |
| Status UI | `UI mock` |
| Status API | `API spec` |
| Critério de aceite | Inbox filtrada por destinatário efetivo |
| Fase roadmap | F4 |

### RF-011 — Leitura persistente

| Campo | Valor |
|-------|--------|
| Subsistema | Comunicados |
| Descrição | Abertura registra leitura por usuário |
| Status UI | `UI mock` — estado local |
| Status API | `API spec` — `comunicado_leitura` |
| Critério de aceite | Contador lido/não lido coerente após reload |
| Fase roadmap | F4 |

### RF-012 — Dashboard AI

| Campo | Valor |
|-------|--------|
| Subsistema | Dashboard |
| Descrição | Cartões, séries temporais, comparativos, insights |
| Status UI | `UI mock` — insights por regras locais |
| Status API | `API spec` — `/dashboard/resumo` |
| Critério de aceite | Dados de agregações reais no período filtrado |
| Fase roadmap | F6 |

### RF-013 — Nota objetiva pós-submissão

| Campo | Valor |
|-------|--------|
| Subsistema | Observabilidade |
| Descrição | Nota calculada para MCQ ao enviar submissão |
| Status UI | `Não iniciado` |
| Status API | `API spec` — job `correcao_objetiva` |
| Critério de aceite | `nota_decimal` e flags em `resposta_questao` preenchidos |
| Fase roadmap | F3, F6 |

### RF-014 — Relatório IA assíncrono

| Campo | Valor |
|-------|--------|
| Subsistema | Observabilidade |
| Descrição | Job LLM gera parecer textual versionado |
| Status UI | `Não iniciado` |
| Status API | `API spec` — `relatorio_ia` + fila |
| Critério de aceite | Relatório visível a perfis autorizados; `status_job` tratado |
| Fase roadmap | F6 |

### RF-015 — Navegação móvel

| Campo | Valor |
|-------|--------|
| Subsistema | Global |
| Descrição | Painel lateral (Sheet) equivalente à sidebar |
| Status UI | `UI mock` — implementado em [`barra-lateral.tsx`](../frontend/componentes/layout/barra-lateral.tsx) |
| Status API | N/A (frontend) |
| Critério de aceite | Paridade de links; fecha ao navegar |
| Fase roadmap | F1 (por perfil) |

### RF-016 — Sidebar recolhível

| Campo | Valor |
|-------|--------|
| Subsistema | Global |
| Descrição | Modo ícones com tooltip |
| Status UI | `UI mock` |
| Status API | Opcional — `preferencias_ui` |
| Critério de aceite | Estado persiste na sessão/preferências |
| Fase roadmap | F1 |

### RF-017 — Tipos de questão

| Campo | Valor |
|-------|--------|
| Subsistema | Avaliações |
| Descrição | MCQ com alternativas e gabarito; texto aberto |
| Status UI | `UI mock` |
| Status API | `API spec` |
| Critério de aceite | Validação Pydantic em `QuestaoUpsert` |
| Fase roadmap | F3 |

---

### RFs novos (extensão do produto)

### RF-018 — Login e sessão

| Campo | Valor |
|-------|--------|
| Subsistema | Autenticação |
| Descrição | Tela `/login` com e-mail/senha; JWT access+refresh; logout |
| Status UI | `Não iniciado` |
| Status API | `API spec` |
| Critério de aceite | Credenciais válidas emitem token; inválidas 401 |
| Fase roadmap | F1 |

### RF-019 — Shell por perfil

| Campo | Valor |
|-------|--------|
| Subsistema | Global |
| Descrição | Sidebar e rotas dinâmicas conforme `tipo_perfil`; middleware de rotas |
| Status UI | `Não iniciado` |
| Status API | `GET /auth/me` |
| Critério de aceite | Aluno não acessa editor de avaliação |
| Fase roadmap | F1, F5 |

### RF-020 — Módulo Configurações

| Campo | Valor |
|-------|--------|
| Subsistema | Administração |
| Descrição | CRUD professores, alunos, responsáveis, turmas, matrículas, vínculos |
| Status UI | `Não iniciado` |
| Status API | `API spec` — `/cadastros/*` |
| Critério de aceite | Administrador cadastra turma com alunos e professor titular |
| Fase roadmap | F2 |

### RF-021 — Super Admin cross-tenant

| Campo | Valor |
|-------|--------|
| Subsistema | Plataforma |
| Descrição | Listar instituições, professores e turmas em todas as escolas |
| Status UI | `Não iniciado` |
| Status API | `API spec` — `/admin/*`, `/super-admin/*` |
| Critério de aceite | Sem vazamento entre tenants em rotas institucionais normais |
| Fase roadmap | F2 |

### RF-022 — Visão aluno (provas)

| Campo | Valor |
|-------|--------|
| Subsistema | Aluno |
| Descrição | Materiais + aba Minhas provas; resolver e enviar |
| Status UI | `Não iniciado` |
| Status API | `API spec` — `/aluno/*` |
| Critério de aceite | Aluno vê só publicadas no prazo; uma submissão por prova |
| Fase roadmap | F5 |

### RF-023 — Visão responsável

| Campo | Valor |
|-------|--------|
| Subsistema | Responsável |
| Descrição | Dashboard e comunicados dos dependentes; leitura de relatórios IA |
| Status UI | `Não iniciado` |
| Status API | `API spec` |
| Critério de aceite | 403 ao acessar aluno não vinculado |
| Fase roadmap | F6 |

### RF-024 — Administrador institucional

| Campo | Valor |
|-------|--------|
| Subsistema | Administração |
| Descrição | Acesso total na instituição: cadastros + módulos pedagógicos |
| Status UI | `Não iniciado` |
| Status API | `API spec` |
| Critério de aceite | Administrador executa ações de professor e de cadastro |
| Fase roadmap | F2 |

---

## Requisitos não funcionais (RNF)

| ID | Domínio | Expectativa |
|----|---------|-------------|
| RNF-001 | Arquitetura | Monólito modular FastAPI; satélites para IA/blob/filas |
| RNF-002 | Desempenho | Dashboard paginado/agregado; chat com timeout e retry |
| RNF-003 | Segurança | Zero-Trust; RBAC por rota; TLS; proteção IDOR por tenant |
| RNF-004 | IA | Pareceres auditáveis; versão de modelo/prompt quando exigido |
| RNF-005 | Acessibilidade | Contraste, foco, labels, modais e leitor de tela |
| RNF-006 | i18n/tempo | UTC no banco; exibição localizada; UI em pt-BR no MVP |
| RNF-007 | Super admin | Auditoria de ações sensíveis (criar/desativar instituição) |

---

## Mapeamento RF → endpoints (resumo)

| RF | Endpoints principais |
|----|---------------------|
| RF-001 | `/search`, `/notificacoes*`, `/users/me/preferences` |
| RF-002 | Middleware global |
| RF-003–004 | `/conteudo/*`, `/uploads/presign` |
| RF-005–009, 017 | `/avaliacoes/*`, `/aluno/*` |
| RF-010–011 | `/comunicados/*` |
| RF-012–014 | `/dashboard/resumo`, `/submissoes/*/relatorio-ia` |
| RF-018–019 | `/auth/*` |
| RF-020–021, 024 | `/cadastros/*`, `/admin/*`, `/super-admin/*` |

Detalhamento completo: [07-api-contrato-backend.md](./07-api-contrato-backend.md).

---

## Referências

- Histórias Gherkin: [09-historias-usuario-gherkin.md](./09-historias-usuario-gherkin.md)
- Status vivo: [10-status-implementacao.md](./10-status-implementacao.md)
