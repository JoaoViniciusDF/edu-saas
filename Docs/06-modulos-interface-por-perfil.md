# Módulos de interface por perfil

Mapeamento entre rotas Next.js, componentes existentes, perfis autorizados e endpoints da API.

## Shell global (todos os perfis autenticados)

| Componente | Arquivo | Comportamento atual | Alvo |
|------------|---------|---------------------|------|
| Layout app | `app/(app)/layout.tsx` | BarraLateral + Cabecalho + main | Variantes por route group |
| Sidebar | `componentes/layout/barra-lateral.tsx` | 4 links fixos | Itens condicionais por `tipo_perfil` |
| Cabeçalho | `componentes/layout/cabecalho.tsx` | Busca, notificações, tema, perfil mock | Dados de `/auth/me` |
| Tema | `componentes/provedores/provedor-tema.tsx` | next-themes | Sync com `/users/me/preferences` |

### Itens de navegação por perfil

| Item | Professor | Administrador | Aluno | Responsável | Super Admin |
|------|:---------:|:-------------:|:-----:|:-----------:|:-----------:|
| Conteúdo | ✅ | ✅ | ✅ | ❌ | ❌ |
| Avaliações | ✅ | ✅ | ❌ | ❌ | ❌ |
| Minhas provas | ❌ | ❌ | ✅ | ❌ | ❌ |
| Comunicados | ✅ | ✅ | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ❌ | ✅ | ❌ |
| Configurações | ❌ | ✅ | ❌ | ❌ | ❌ |
| Super Admin | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Rotas existentes (professor — mock)

| Rota | Página | Componente | API alvo |
|------|--------|------------|----------|
| `/` | redirect | → `/conteudo` | — |
| `/conteudo` | `app/(app)/conteudo/page.tsx` | `modulo-conteudo.tsx` | `/conteudo/*` |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | `modulo-dashboard.tsx` | `/dashboard/resumo` |
| `/comunicados` | `app/(app)/comunicados/page.tsx` | `modulo-comunicados.tsx` | `/comunicados/*` |
| `/avaliacoes` | `app/(app)/avaliacoes/page.tsx` | `modulo-avaliacoes.tsx` | `/avaliacoes/materias` |
| `/avaliacoes/[materia]` | `[materia]/page.tsx` | idem | `/avaliacoes/materias/{id}/arvore` |
| `/avaliacoes/[materia]/[conteudo]` | pasta | idem | `/avaliacoes/pastas/{id}` |
| `/avaliacoes/.../[avaliacao]` | editor | idem + sidecar IA | `/avaliacoes/avaliacoes/{id}` |

Layout de avaliações: `app/(app)/avaliacoes/layout.tsx` envolve `ProvedorAvaliacoes` — **substituir** por fetch + React Query na F3.

---

## Rotas novas (a implementar)

### Login — RF-018

```
app/login/page.tsx
```

- Formulário e-mail/senha
- `POST /api/v1/auth/login` via `lib/api/auth.ts`
- Armazenar tokens; redirecionar conforme [03-dominio](./03-dominio-entidades-e-rbac.md#roteamento-pós-login-frontend)
- `middleware.ts`: rotas públicas vs protegidas

### Configurações — RF-020, RF-024

```
app/(app)/configuracoes/
  layout.tsx              # Tabs: Professores, Turmas, Alunos, Responsáveis
  page.tsx                # Redirect → professores
  professores/page.tsx
  professores/[id]/page.tsx
  turmas/page.tsx
  turmas/[id]/page.tsx    # Matrículas da turma
  alunos/page.tsx
  alunos/[id]/page.tsx    # Vínculos responsáveis
  responsaveis/page.tsx
```

| Tela | Ações | API |
|------|-------|-----|
| Lista professores | Criar, editar, desativar | `/cadastros/professores` |
| Lista turmas | Criar turma, definir titular | `/cadastros/turmas` |
| Detalhe turma | Matricular aluno | `/cadastros/matriculas` |
| Lista alunos | Criar, vincular responsável | `/cadastros/alunos`, `.../responsaveis` |

### Super Admin — RF-021

```
app/super-admin/
  layout.tsx
  page.tsx                # Dashboard resumo plataforma
  instituicoes/page.tsx
  instituicoes/nova/page.tsx
  professores/page.tsx    # Filtro por instituição
  turmas/page.tsx
```

API: `/admin/instituicoes`, `/super-admin/professores`, `/super-admin/turmas`.

### Área do aluno — RF-022

```
app/(aluno)/
  layout.tsx              # Sidebar: Conteúdo, Minhas provas, Comunicados
  conteudo/page.tsx       # Reutilizar modulo-conteudo (modo leitura)
  provas/page.tsx         # Lista GET /aluno/avaliacoes/disponiveis
  provas/[id]/page.tsx    # Resolver prova
  comunicados/page.tsx    # Inbox escopada
```

Extrair de `modulo-avaliacoes.tsx`:
- `EditorAvaliacao` → só professor/admin
- `ResolverAvaliacao` → novo componente aluno (sem gabarito, sem sidecar IA)

### Área do responsável — RF-023

Opção MVP: reutilizar route group `(app)` com sidebar filtrada:
- Dashboard (`modulo-dashboard.tsx` com escopo fixo `aluno` = dependente)
- Comunicados leitura
- Sem Conteúdo/Avaliações de edição

---

## Módulo Conteúdo (`modulo-conteudo.tsx`)

| Funcionalidade UI | Estado | Integração |
|-------------------|--------|------------|
| Grid de pastas disciplina | Mock 8 pastas | `GET /conteudo/pastas` |
| Timeline por pasta | Mock `materiaisPorPasta` | `GET /conteudo/pastas/{id}/materiais` |
| Modal visualização | Tipos pdf/audio/imagem/video/nota | `GET /conteudo/materiais/{id}` |
| Modal nova nota | Estado local | `POST .../materiais` |
| Upload arquivo | UI only | `POST /uploads/presign` |

**Aluno:** mesma listagem sem botões de criação/edição.

---

## Módulo Avaliações (`modulo-avaliacoes.tsx`)

| Funcionalidade UI | Estado | Integração |
|-------------------|--------|------------|
| Listagem matérias | Mock + context | `GET/POST /avaliacoes/materias` |
| Árvore assunto/pasta | Context | `GET .../arvore` |
| Editor questões MCQ/abertas | Mock | `salvar-rascunho`, questões |
| Sidecar IA | Respostas fake | `POST .../chat` |
| Publicar / encerrar | UI local | `POST .../publicar`, `.../encerrar` |
| Calendário prazo | UI | `prazo_utc` no PATCH/salvar |
| Contadores pasta | Mock | Campos derivados API |

Refatoração recomendada (F3/F5):
- `hooks/useAvaliacoesApi.ts`
- `componentes/avaliacoes/editor-professor.tsx`
- `componentes/avaliacoes/lista-aluno.tsx`

---

## Módulo Comunicados (`modulo-comunicados.tsx`)

| Funcionalidade UI | Estado | Integração |
|-------------------|--------|------------|
| Inbox lista + detalhe | Mock | `GET /comunicados` |
| Marcar lido | Local | `GET` dispara leitura ou `POST .../marcar-lido` |
| Novo comunicado | Mock destinatários | `POST /comunicados` |
| Imagens clipboard | data URLs | presign + URLs |

---

## Dashboard (`modulo-dashboard.tsx`)

| Funcionalidade UI | Estado | Integração |
|-------------------|--------|------------|
| Filtros escopo/turma/aluno/datas | UI | query `/dashboard/resumo` |
| Cartões resumo | Calculados local | `cartoes` da API |
| Gráficos Recharts | Mock `registros` | `serie_temporal`, `disciplinas` |
| Insights | Regras locais | `insights` da API ou híbrido |

**Responsável:** mesmos componentes com `escopo=aluno` e `aluno_id` do dependente selecionado.

---

## Tabela endpoint → tela (amostra)

| Endpoint | Tela |
|----------|------|
| `POST /auth/login` | `/login` |
| `GET /auth/me` | Cabeçalho / layout |
| `GET /cadastros/turmas` | `/configuracoes/turmas` |
| `POST /cadastros/matriculas` | `/configuracoes/turmas/[id]` |
| `GET /avaliacoes/materias` | `/avaliacoes` |
| `GET /aluno/avaliacoes/disponiveis` | `/aluno/provas` |
| `POST /aluno/submissoes/{id}/enviar` | `/aluno/provas/[id]` |
| `GET /comunicados` | `/comunicados` |
| `GET /dashboard/resumo` | `/dashboard` |
| `GET /super-admin/professores` | `/super-admin/professores` |

Lista completa: [07-api-contrato-backend.md](./07-api-contrato-backend.md#catálogo-de-endpoints).

---

## Referências

- API: [07-api-contrato-backend.md](./07-api-contrato-backend.md)
- Configurações: [08-configuracoes-sistema.md](./08-configuracoes-sistema.md)
- Status: [10-status-implementacao.md](./10-status-implementacao.md)
