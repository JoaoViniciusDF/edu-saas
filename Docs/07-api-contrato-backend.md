# Contrato da API Backend (FastAPI)

**Versão:** 1.2 (implementação controllers F1–F6, IA adiada)  
**Base URL:** `/api/v1`  
**Fonte legada:** [roadmap-backend.txt](../roadmap-backend.txt) — conteúdo consolidado aqui.

**Status implementação (backend):** **84 rotas** em `/api/v1` via controllers; **4 rotas IA** reservadas para `IAController.py` (próxima fase). Ver mapa em [backend/README.md](../backend/README.md).

---

## 1. Convenções

### 1.1 Stack

- Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, PostgreSQL 16+
- JWT access (15–30 min) + refresh (rotação)
- Hash senha: argon2 ou bcrypt

### 1.2 Multi-tenant

- Raiz: `instituicao_id` em entidades de negócio
- Token carrega `instituicao_id` exceto `super_admin`
- IDOR: ID de outro tenant → **404** ou **403**

### 1.3 Envelope de erro

```json
{
  "code": "FORBIDDEN_PROFILE",
  "message": "Perfil não autorizado para esta operação",
  "details": { "campo": ["erro"] }
}
```

| HTTP | Uso |
|------|-----|
| 400 | Regra de negócio |
| 401 | Não autenticado |
| 403 | Perfil ou estado inválido |
| 404 | Não encontrado / fora do tenant |
| 409 | Conflito (submissão duplicada, transição estado) |
| 422 | Validação Pydantic |
| 429 | Rate limit login/search |

### 1.4 Paginação

```json
{
  "items": [],
  "next_cursor": "opaque|null",
  "has_more": false
}
```

---

## 2. Perfis e autorização

Enum `PerfilUsuario`: `super_admin` | `administrador` | `professor` | `aluno` | `responsavel`

Legenda na matriz: **SA** super_admin · **Adm** administrador · **P** professor · **A** aluno · **R** responsável · **·** sem acesso · **O** escopo restrito

---

## 3. Catálogo de endpoints (~80 rotas)

### 3.1 Autenticação e usuário

| Método | Path | Perfis | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/login` | público | Login e-mail/senha → tokens + UserMe |
| POST | `/auth/refresh` | autenticado | Renovar access token |
| POST | `/auth/logout` | autenticado | Revogar refresh (204) |
| GET | `/auth/me` | autenticado | Perfil e preferências |
| PATCH | `/users/me/preferences` | autenticado | tema, idioma, densidade_ui |

**LoginRequest:** `{ email, senha }`  
**LoginResponse:** `{ access_token, refresh_token, token_type, expira_em, usuario: UserMe }`  
**UserMe:** `{ usuario_id, email, nome_exibicao, perfil, instituicao_id|null, preferencias }`

**Tela:** `/login`, cabeçalho global

---

### 3.2 Administração — Super Admin (NOVO)

| Método | Path | Perfis | Descrição |
|--------|------|--------|-----------|
| GET | `/admin/instituicoes` | SA | Lista instituições (paginada) |
| POST | `/admin/instituicoes` | SA | Cria instituição + opcional primeiro administrador |
| GET | `/admin/instituicoes/{id}` | SA | Detalhe |
| PATCH | `/admin/instituicoes/{id}` | SA | Atualiza nome, config, status |
| GET | `/super-admin/professores` | SA | Lista professores; query `instituicao_id` opcional |
| GET | `/super-admin/turmas` | SA | Lista turmas; query `instituicao_id` opcional |
| GET | `/super-admin/resumo` | SA | Totais: instituições, professores, turmas, alunos |

**InstituicaoCreate:** `{ nome_fantasia, documento_legal?, administrador_inicial?: { email, senha, nome_exibicao } }`

**Telas:** `/super-admin/*` — ver [06-modulos-interface](./06-modulos-interface-por-perfil.md)

---

### 3.3 Cadastros — Administrador institucional (NOVO)

| Método | Path | Perfis | Descrição |
|--------|------|--------|-----------|
| GET | `/cadastros/professores` | Adm | Lista professores da instituição |
| POST | `/cadastros/professores` | Adm | Cria professor + usuario_conta |
| GET | `/cadastros/professores/{id}` | Adm | Detalhe |
| PATCH | `/cadastros/professores/{id}` | Adm | Atualiza dados |
| DELETE | `/cadastros/professores/{id}` | Adm | Desativa (soft) |
| GET | `/cadastros/alunos` | Adm | Lista alunos |
| POST | `/cadastros/alunos` | Adm | Cria aluno + conta |
| GET | `/cadastros/alunos/{id}` | Adm | Detalhe |
| PATCH | `/cadastros/alunos/{id}` | Adm | Atualiza |
| GET | `/cadastros/responsaveis` | Adm | Lista responsáveis |
| POST | `/cadastros/responsaveis` | Adm | Cria responsável |
| GET | `/cadastros/responsaveis/{id}` | Adm | Detalhe |
| POST | `/cadastros/alunos/{id}/responsaveis` | Adm | Vincula `{ responsavel_id, responsavel_principal? }` |
| DELETE | `/cadastros/alunos/{id}/responsaveis/{responsavel_id}` | Adm | Remove vínculo |
| GET | `/cadastros/turmas` | Adm, P* | Lista turmas (*P leitura escopo) |
| POST | `/cadastros/turmas` | Adm | Cria turma |
| GET | `/cadastros/turmas/{id}` | Adm, P | Detalhe + contagem alunos |
| PATCH | `/cadastros/turmas/{id}` | Adm | Nome, ano, professor_titular_id |
| POST | `/cadastros/matriculas` | Adm | `{ aluno_id, turma_id, data_inicio }` |
| PATCH | `/cadastros/matriculas/{id}` | Adm | Encerrar: `situacao`, `data_fim` |

**RN cadastros:**
- E-mail único por `(instituicao_id, lower(email))`
- Matrícula ativa única por aluno (409 se violar)
- Criar professor não concede automaticamente turmas — associar via `professor_titular_id`

**Telas:** `/configuracoes/*`

---

### 3.4 Instituição e leitura base (MVP original)

| Método | Path | Perfis | Descrição |
|--------|------|--------|-----------|
| GET | `/instituicoes/{id}` | Adm,P,A,R,O | Instituição do token |
| GET | `/turmas` | P, A,O, R,O | Lista turmas escopadas |
| GET | `/turmas/{id}` | escopo | Detalhe turma |
| GET | `/turmas/{id}/alunos` | P, R,O | Alunos da turma |
| GET | `/alunos/{id}` | P, A,O, R,O | Detalhe aluno |
| GET | `/alunos/{id}/responsaveis` | P, A,O | Responsáveis do aluno |

---

### 3.5 Busca e notificações

| Método | Path | Perfis | Descrição |
|--------|------|--------|-----------|
| GET | `/search` | P completo; A,R restrito | `q` min 2 chars; `types` CSV |
| GET | `/notificacoes` | todos | Inbox notificações |
| PATCH | `/notificacoes/{id}/lida` | dono | Marca lida |
| POST | `/notificacoes/marcar-todas-lidas` | dono | Bulk |

**SearchHit:** `{ id, tipo, titulo, subtitulo, url_deep_link }`

---

### 3.6 Avaliações — hierarquia (professor/administrador)

| Método | Path | Perfis |
|--------|------|--------|
| GET | `/avaliacoes/materias` | P, Adm |
| POST | `/avaliacoes/materias` | P, Adm |
| PATCH | `/avaliacoes/materias/{id}` | P, Adm |
| DELETE | `/avaliacoes/materias/{id}` | P, Adm |
| GET | `/avaliacoes/materias/{id}/arvore` | P, Adm |
| POST | `/avaliacoes/materias/{id}/assuntos` | P, Adm |
| PATCH | `/avaliacoes/assuntos/{id}` | P, Adm |
| DELETE | `/avaliacoes/assuntos/{id}` | P, Adm |
| POST | `/avaliacoes/assuntos/{id}/pastas` | P, Adm |
| GET | `/avaliacoes/pastas/{id}` | P, Adm |
| PATCH | `/avaliacoes/pastas/{id}` | P, Adm |
| GET | `/avaliacoes/pastas/{id}/avaliacoes` | P, Adm |
| POST | `/avaliacoes/pastas/{id}/avaliacoes` | P, Adm |
| GET | `/avaliacoes/avaliacoes/{id}` | P, Adm |
| PATCH | `/avaliacoes/avaliacoes/{id}` | P, Adm |
| POST | `/avaliacoes/avaliacoes/{id}/salvar-rascunho` | P, Adm |
| POST | `/avaliacoes/avaliacoes/{id}/publicar` | P, Adm |
| POST | `/avaliacoes/avaliacoes/{id}/encerrar` | P, Adm |
| PUT | `/avaliacoes/avaliacoes/{id}/questoes` | P, Adm |
| POST | `/avaliacoes/avaliacoes/{id}/questoes` | P, Adm |
| PATCH | `/avaliacoes/avaliacoes/{id}/questoes/{qid}` | P, Adm |
| DELETE | `/avaliacoes/avaliacoes/{id}/questoes/{qid}` | P, Adm |
| POST | `/avaliacoes/avaliacoes/{id}/questoes/reordenar` | P, Adm |
| POST | `/avaliacoes/avaliacoes/{id}/chat` | P, Adm |
| GET | `/avaliacoes/avaliacoes/{id}/chat` | P, Adm |

**RN publicar:** status `rascunho` → `publicada`; ≥1 questão válida; MCQ com ≥2 alternativas e gabarito válido.  
**RN encerrar:** `publicada` → `encerrada` irreversível.  
**Contadores pasta:** somente leitura, derivados de `submissao`.

---

### 3.7 Fluxo aluno

| Método | Path | Perfis |
|--------|------|--------|
| GET | `/aluno/avaliacoes/disponiveis` | A |
| GET | `/aluno/avaliacoes/{id}` | A |
| POST | `/aluno/avaliacoes/{id}/submissoes` | A |
| PATCH | `/aluno/submissoes/{id}` | A |
| POST | `/aluno/submissoes/{id}/enviar` | A |

**RN:** uma submissão por `(avaliacao_id, aluno_id)`; validar `prazo_utc` UTC; sem gabarito na view aluno.

---

### 3.8 Conteúdo didático

| Método | Path | Perfis |
|--------|------|--------|
| GET | `/conteudo/pastas` | P, Adm, A leitura |
| POST | `/conteudo/pastas` | P, Adm |
| PATCH | `/conteudo/pastas/{id}` | P, Adm |
| DELETE | `/conteudo/pastas/{id}` | P, Adm |
| GET | `/conteudo/pastas/{id}/materiais` | P, Adm, A |
| POST | `/conteudo/pastas/{id}/materiais` | P, Adm |
| GET | `/conteudo/materiais/{id}` | P, Adm, A |
| PATCH | `/conteudo/materiais/{id}` | P, Adm |
| DELETE | `/conteudo/materiais/{id}` | P, Adm |
| POST | `/uploads/presign` | P, Adm |

---

### 3.9 Comunicados

| Método | Path | Perfis |
|--------|------|--------|
| GET | `/comunicados` | P, Adm, A, R |
| GET | `/comunicados/{id}` | escopo |
| POST | `/comunicados/{id}/marcar-lido` | escopo |
| POST | `/comunicados` | P, Adm |
| PATCH | `/comunicados/{id}` | P, Adm |
| POST | `/comunicados/{id}/publicar` | P, Adm |

**DestinatarioRef:** `{ tipo: aluno|turma|responsavel, id }` — expandir turma na publicação.

---

### 3.10 Dashboard, busca e notificações

| Método | Path | Perfis | Controller |
|--------|------|--------|------------|
| GET | `/dashboard/resumo` | P, Adm, R,O | `DashboardController` |
| GET | `/search` | P; A,R restrito | `DashboardController` |
| GET | `/notificacoes` | todos autenticados | `DashboardController` |
| PATCH | `/notificacoes/{id}/lida` | dono | `DashboardController` |
| POST | `/notificacoes/marcar-todas-lidas` | dono | `DashboardController` |

**Query dashboard:** `escopo`, `turma_id`, `aluno_id`, `data_inicio`, `data_fim`

**Nota:** `POST /uploads/presign` retorna URL **stub** (sem S3 real no MVP).

---

### 3.11 IA — próxima fase (`IAController.py`)

Não implementado nesta entrega. Rotas previstas:

| Método | Path | Perfis |
|--------|------|--------|
| POST | `/avaliacoes/avaliacoes/{id}/chat` | P, Adm |
| GET | `/avaliacoes/avaliacoes/{id}/chat` | P, Adm |
| GET | `/submissoes/{id}/relatorio-ia` | P, Adm, R,O, A,O |
| GET | `/submissoes/{id}/relatorio-ia/historico` | idem |

Jobs assíncronos (`relatorio_ia`, filas) documentados na seção 6.

---

### 3.12 Mapa controller → domínio

| Arquivo | Rotas (grupos) |
|---------|----------------|
| `ConfiguracoesController.py` | `/auth/*`, `/users/me/preferences`, `/admin/*`, `/super-admin/*`, `/cadastros/*`, `/instituicoes/{id}`, `/turmas*`, `/alunos*` |
| `AvaliacoesController.py` | `/avaliacoes/*` (sem chat), `/aluno/avaliacoes/*`, `/aluno/submissoes/*` |
| `ConteudoController.py` | `/conteudo/*`, `/uploads/presign` |
| `ComunicadosController.py` | `/comunicados/*` |
| `DashboardController.py` | `/dashboard/resumo`, `/search`, `/notificacoes*` |

---

## 4. DTOs principais (Pydantic)

### Enums

```
StatusConta: ativa | suspensa | pendente_ativacao
StatusAvaliacao: rascunho | publicada | encerrada
StatusComunicado: rascunho | publicado
TipoAnexoMaterial: pdf | audio | imagem | video | nota
TipoQuestao: multipla_escolha | texto_aberto
StatusSubmissao: rascunho | enviada | corrigida_parcialmente | corrigida
```

### QuestaoUpsert

```python
id: UUID | None
tipo: TipoQuestao
ordem: int
enunciado: str  # min 1
alternativas: list[str] | None  # MCQ: len >= 2
resposta_correta: int | None     # índice 0..n-1
peso: Decimal = 1
```

### RespostaQuestaoInput (aluno)

```python
questao_id: UUID
valor_texto: str | None
indice_selecionado: int | None
```

### ComunicadoCreateRequest

```python
titulo: str
corpo: str
imagens_urls: list[str]
destinatarios: list[DestinatarioRef]
status_inicial: rascunho | publicado
```

---

## 5. Regras de negócio

1. **Ciclo avaliação:** rascunho → publicada → encerrada (irreversível MVP)
2. **Edição questões:** apenas `rascunho` (403 caso contrário)
3. **Prazo:** UTC no servidor; encerramento manual prevalece
4. **Submissão:** UNIQUE `(avaliacao_id, aluno_id)`
5. **Comunicados:** título e (corpo ou imagens); ≥1 destinatário
6. **IA:** chat só professor; relatório versionado pós-envio
7. **Privacidade:** responsável só dependentes em `aluno_responsavel`

---

## 6. Jobs assíncronos

| Fila | Gatilho |
|------|---------|
| `correcao_objetiva` | `POST .../enviar` submissão |
| `relatorio_ia` | após correção objetiva |
| `expiracao_avaliacao` | cron opcional pós `prazo_utc` |
| `reindexacao_search` | CRUD títulos/comunicados |
| `reconciliar_contadores_pasta` | periódico se sem view |

---

## 7. Apêndice — Matriz endpoint × perfil (resumo)

| Grupo | SA | Adm | P | A | R |
|-------|:--:|:---:|:--:|:-:|:-:|
| `/admin/*`, `/super-admin/*` | RW | · | · | · | · |
| `/cadastros/*` | · | RW | R* | · | · |
| `/avaliacoes/*` (docente) | · | RW | RW | · | · |
| `/aluno/*` | · | · | · | RW | · |
| `/conteudo/*` CRUD | · | RW | RW | R | R** |
| `/comunicados` criar | · | RW | RW | · | · |
| `/comunicados` ler | · | R | R | R | R |
| `/dashboard/resumo` | R*** | R | R | · | O |

\* Professor: leitura turmas/alunos para destinatários  
\*\* Responsável: leitura conforme política  
\*\*\* Super admin: agregados globais, não pedagógico por turma

Matriz detalhada endpoint a endpoint: ver Apêndice A em [roadmap-backend.txt](../roadmap-backend.txt) linhas 1083–1152 (mantida como referência até próxima revisão).

---

## 8. Apêndice — Códigos HTTP

| Código | Operações |
|--------|-----------|
| 200 | GET/PATCH sucesso |
| 201 | POST criação |
| 202 | Job IA assíncrono |
| 204 | DELETE, logout |
| 400/403/404/409/422/429 | Ver seção 1.3 |

---

## 9. Mapeamento RF → endpoints

| RF | Endpoints |
|----|-----------|
| RF-001 | `/search`, `/notificacoes*`, `/users/me/preferences` |
| RF-002 | Middleware global |
| RF-003–004 | `/conteudo/*`, `/uploads/presign` |
| RF-005–009, 017 | `/avaliacoes/*`, `/aluno/*` |
| RF-010–011 | `/comunicados/*` |
| RF-012–014 | `/dashboard/resumo`, `/submissoes/*/relatorio-ia` |
| RF-018–019 | `/auth/*` |
| RF-020–021, 024 | `/cadastros/*`, `/admin/*`, `/super-admin/*` |

---

## Referências

- Tabelas: [04-modelo-de-dados.md](./04-modelo-de-dados.md)
- UI: [06-modulos-interface-por-perfil.md](./06-modulos-interface-por-perfil.md)
- Roadmap implementação: [11-roadmap-desenvolvimento.md](./11-roadmap-desenvolvimento.md)
