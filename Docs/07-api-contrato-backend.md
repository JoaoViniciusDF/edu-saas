# Contrato da API Backend (FastAPI)

**Versão:** 2.0 (implementado no backend e frontend)  
**Base URL:** `/` (raiz do servidor, ex.: `http://localhost:8000`)  
**Controllers:** exatamente 5 — `ConfiguracoesController`, `AvaliacoesController`, `ComunicadosController`, `ConteudoController`, `DashboardController`

**Status implementação:** **85 rotas operacionais** + **4 rotas IA** (fase futura). Healthcheck: `GET /health`.

---

## 1. Convenções

### 1.1 Stack

- Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, PostgreSQL 16+
- JWT access (15–30 min) + refresh (rotação)
- Hash senha: argon2 ou bcrypt

### 1.2 Multi-tenant

- Raiz: `instituicao_id` em entidades de negócio
- Token carrega `instituicao_id` exceto `super_admin`
- IDOR: recurso fora do tenant ou fora da alçada do perfil → **404** (preferencial) ou **403**

### 1.3 Nomenclatura de rotas

Padrão obrigatório: `/{controller}/{verbo}-{recurso}[/{id}]`

| Verbo HTTP | Prefixo na URL | Uso |
|------------|----------------|-----|
| GET | `consultar-*` | Listagem ou detalhe |
| POST | `criar-*`, ações de domínio (`publicar-*`, `vincular-*`, `enviar-*`, `iniciar-*`) | Criação ou transição de estado |
| PUT | `editar-*`, `substituir-*`, `atualizar-*` | **Toda** atualização de recurso |
| DELETE | `apagar-*`, `desativar-*`, `desvincular-*` | Remoção ou soft-delete |

Exemplos:

- `POST /avaliacoes/criar-avaliacao/{pasta_id}`
- `PUT /comunicados/editar-comunicado/{id}`
- `DELETE /configuracoes/apagar-aluno/{id}`

**Regra:** a API **não expõe PATCH**. Quando o DTO indicar campos opcionais, PUT aceita payload parcial (merge no serviço).

### 1.4 Prefixos eliminados (v1.2 → v2.0)

Não existem mais rotas sob: `/auth/`, `/users/`, `/admin/`, `/super-admin/`, `/cadastros/`, `/instituicoes/`, `/turmas/`, `/alunos/`, `/aluno/`, `/uploads/`, `/search/`.

Toda operação equivalente migra para um dos 5 controllers acima.

### 1.5 Envelope de erro

```json
{
  "code": "FORBIDDEN_PROFILE",
  "message": "Perfil não autorizado para esta operação",
  "details": { "campo": ["erro"] }
}
```

| HTTP | Uso |
|------|-----|
| 200 | GET/PUT sucesso |
| 201 | POST criação |
| 202 | Job IA assíncrono |
| 204 | DELETE, encerrar sessão |
| 400 | Regra de negócio |
| 401 | Não autenticado |
| 403 | Perfil não autorizado ou estado inválido |
| 404 | Não encontrado / fora do tenant ou alçada |
| 409 | Conflito (submissão duplicada, transição estado) |
| 422 | Validação Pydantic |
| 429 | Rate limit login/busca |

### 1.6 Paginação

```json
{
  "items": [],
  "next_cursor": "opaque|null",
  "has_more": false
}
```

Query comum em listagens: `cursor`, `limit` (default 20, max 100).

---

## 2. Perfis, alçada e autorização

### 2.1 Enum `PerfilUsuario`

`super_admin` | `administrador` | `professor` | `aluno` | `responsavel`

Legenda nas tabelas: **SA** super_admin · **Adm** administrador · **P** professor · **A** aluno · **R** responsável · **·** sem acesso

### 2.2 Modelo de alçada (escopo de dados)

Cada endpoint unificado combina:

1. **Perfis permitidos** — quem pode invocar a rota (403 se não)
2. **Escopo de dados** — quais registros entram na resposta ou podem ser alterados

Implementação (serviço/repositório):

- Extrair `usuario_id`, `tipo_perfil`, `instituicao_id`, `professor_id`, `aluno_id`, `responsavel_id` do JWT
- Aplicar filtro SQL conforme perfil **no mesmo handler** — não duplicar rotas por perfil
- `super_admin`: bypass de checagem de perfil (`require_perfis`), mas **sem** mutações pedagógicas (provas, comunicados, conteúdo)
- Recurso fora do escopo: retornar **404** (não vazar existência)

### 2.3 Matriz resumo por controller

| Controller | SA | Adm | P | A | R |
|------------|:--:|:---:|:--:|:-:|:-:|
| `/configuracoes/*` cadastro global | RW instituições | RW instituição | RW escopo turmas titular | R próprio | R dependentes |
| `/avaliacoes/*` docente | · | RW | RW | · | · |
| `/avaliacoes/*` aluno | · | · | · | RW submissão | · |
| `/conteudo/*` | · | RW | RW | R turmas | · |
| `/comunicados/*` | · | RW | RW | R inbox | R inbox |
| `/dashboard/*` | R agregado | R instituição | R turmas | R busca restrita | R dependentes |

---

## 3. Catálogo de endpoints

Todos os paths abaixo são relativos à raiz da API (sem prefixo `/api/v1`).

---

### 3.1 ConfiguracoesController (35 rotas)

Arquivo: `backend/app/controllers/ConfiguracoesController.py`

#### 3.1.1 Autenticação e perfil

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| POST | `/configuracoes/autenticar` | público | Login e-mail/senha → tokens + UserMe |
| POST | `/configuracoes/renovar-token` | refresh válido | Renova access token; body opcional `{ impersonator_id }` preserva sessão assumida |
| POST | `/configuracoes/encerrar-sessao` | autenticado | Revoga refresh (204) |
| GET | `/configuracoes/consultar-perfil` | autenticado | Próprio usuário e preferências |
| PUT | `/configuracoes/atualizar-preferencias` | autenticado | tema, idioma, densidade_ui |
| POST | `/configuracoes/assumir-sessao/{usuario_id}` | SA | Emite tokens do usuário alvo com claim `impersonator_id` |
| POST | `/configuracoes/restaurar-sessao-admin` | body `{ refresh_token }` do SA | Restaura sessão super admin após impersonação |

**AutenticarRequest:** `{ email, senha }`  
**AutenticarResponse:** `{ access_token, refresh_token, token_type, expira_em, usuario: UserMe }`  
**UserMe:** `{ usuario_id, email, nome_exibicao, perfil, instituicao_id|null, preferencias, professor_id?, aluno_id?, responsavel_id?, impersonador? }`  
**impersonador** (quando SA assumiu sessão): `{ usuario_id, email, nome_exibicao }`

**Telas:** `/login`, cabeçalho global

#### 3.1.2 Instituições e plataforma

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/configuracoes/consultar-instituicoes` | SA | Todas as instituições; paginado |
| POST | `/configuracoes/criar-instituicao` | SA | Cria instituição + opcional primeiro administrador |
| GET | `/configuracoes/consultar-instituicao/{id}` | SA, Adm | SA: qualquer; Adm: só a do token |
| PUT | `/configuracoes/editar-instituicao/{id}` | SA, Adm | Idem |
| GET | `/configuracoes/consultar-resumo-plataforma` | SA | Totais: instituições, professores, turmas, alunos |
| GET | `/configuracoes/consultar-resumo-instituicao/{id}` | SA | Contagens + lista de usuários da escola (para impersonação) |
| GET | `/configuracoes/consultar-diretorio-plataforma` | SA | Diretório cross-tenant (`visao`, filtros, paginação) |
| GET | `/configuracoes/consultar-detalhe-usuario/{usuario_id}` | SA | Ficha unificada por `usuario_id` (todos os perfis tenant) |
| GET | `/configuracoes/consultar-detalhe-aluno/{aluno_id}` | SA | Legado: detalhe por entidade aluno |
| GET | `/configuracoes/consultar-detalhe-professor/{prof_id}` | SA | Legado: detalhe por entidade professor |
| PUT | `/configuracoes/editar-usuario/{usuario_id}` | SA | Edita conta + campos do perfil |
| DELETE | `/configuracoes/desativar-usuario/{usuario_id}` | SA | Soft delete (`status_conta=suspensa`) |
| PUT | `/configuracoes/associar-usuario-instituicao/{usuario_id}` | SA | Body `{ instituicao_id }` — transfere usuário de escola |
| POST | `/configuracoes/criar-matriculas-lote` | SA, Adm | Body `{ instituicao_id?, turma_id, aluno_ids[], data_inicio }` — Adm omite `instituicao_id` (usa a do token) |
| POST | `/configuracoes/vincular-responsavel-alunos-lote` | SA | Body `{ instituicao_id, responsavel_id, aluno_ids[], responsavel_principal? }` |
| DELETE | `/configuracoes/desvincular-responsavel-alunos-lote` | SA | Body `{ instituicao_id, responsavel_id, aluno_ids[] }` |
| PUT | `/configuracoes/associar-professor-turmas-lote` | SA, Adm | Body `{ instituicao_id, professor_id, turma_ids[], professor_titular_turma_id? }` — vínculo N:N; titular opcional em uma das turmas |
| POST | `/configuracoes/associar-professores-turma-lote` | SA, Adm | Body `{ instituicao_id, turma_id, professor_ids[], professor_titular_id? }` — vários professores na mesma turma |
| DELETE | `/configuracoes/desassociar-professor-turmas-lote` | SA, Adm | Body `{ instituicao_id, turma_ids[], professor_id? }` — sem `professor_id`, remove titular legado da turma |
| PUT | `/configuracoes/editar-matricula-super-admin/{mat_id}` | SA | Query `instituicao_id` + body `MatriculaPatch` |
| GET | `/configuracoes/consultar-minha-instituicao` | Adm, P, A, R | Instituição do token (`instituicao_id` obrigatório) |

**InstituicaoCreate:** `{ nome_fantasia, documento_legal?, administrador_inicial?: { email, senha, nome_exibicao } }`

**LoteResultado:** `{ sucesso: UUID[], falhas: { id, motivo }[] }`

**Telas:** `/super-admin/*`, `/configuracoes`

#### 3.1.3 Professores

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/configuracoes/consultar-professores` | SA, Adm | SA: todos (`?instituicao_id=` opcional); Adm: instituição |
| POST | `/configuracoes/criar-usuario` | Dev: aberto; prod: SA, Adm, P | Corpo unificado com `tipo_perfil`; SA deve informar `instituicao_id` |
| GET | `/configuracoes/consultar-professor/{id}` | SA, Adm | Professor da instituição visível |
| PUT | `/configuracoes/editar-professor/{id}` | Adm | Instituição do token |
| DELETE | `/configuracoes/desativar-professor/{id}` | Adm | Soft: `status_conta=suspensa` |

#### 3.1.4 Alunos

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/configuracoes/consultar-alunos` | SA, Adm, P, A, R | Ver alçada abaixo |
| GET | `/configuracoes/consultar-aluno/{id}` | SA, Adm, P, A, R | Mesmo filtro de visibilidade |
| PUT | `/configuracoes/editar-aluno/{id}` | Adm, P | Adm: instituição; P: alunos das turmas titular |
| DELETE | `/configuracoes/apagar-aluno/{id}` | Adm | Soft-delete / desativação |

##### Alçada: GET `/configuracoes/consultar-alunos`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| super_admin | Sim | Todos os alunos; filtro opcional `instituicao_id` |
| administrador | Sim | Todos os alunos da instituição do token |
| professor | Sim | Alunos matriculados em turmas onde é `professor_titular` |
| aluno | Sim | Somente o próprio registro |
| responsavel | Sim | Alunos vinculados em `aluno_responsavel` |

##### Alçada: GET `/configuracoes/consultar-aluno/{id}`

| Perfil | Pode chamar? | Condição |
|--------|:------------:|----------|
| super_admin | Sim | Qualquer aluno |
| administrador | Sim | Aluno da instituição |
| professor | Sim | Aluno em turma titular |
| aluno | Sim | Apenas `id` = próprio `aluno_id` |
| responsavel | Sim | Apenas dependentes vinculados |

#### 3.1.5 Turmas e matrículas

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/configuracoes/consultar-turmas` | SA, Adm, P, A, R | Ver alçada abaixo |
| POST | `/configuracoes/criar-turma` | Adm, P | Adm: instituição; P: cria turma com titular = si |
| GET | `/configuracoes/consultar-turma/{id}` | SA, Adm, P, A, R | Detalhe + contagem alunos; escopo por perfil |
| PUT | `/configuracoes/editar-turma/{id}` | Adm, P | Adm: qualquer turma da instituição; P: turmas titular; `professor_titular_id` sincroniza junction `turma_professor` |
| GET | `/configuracoes/consultar-alunos-turma/{turma_id}` | Adm, P, R | Adm: qualquer turma; P: se titular; R: se dependente matriculado |
| POST | `/configuracoes/criar-matricula` | Adm, P | `{ aluno_id, turma_id, data_inicio }`; P: turma titular |
| PUT | `/configuracoes/editar-matricula/{id}` | Adm, P | Encerrar: `{ situacao, data_fim }`; P: matrícula em turma titular |

**TurmaListItem** inclui `professores: { id, nome_exibicao, eh_titular }[]` além de `professor_titular_*` (derivado do titular na junction). Tabela `turma_professor` (N:N) com no máximo um `eh_titular=true` por turma.

##### Alçada: GET `/configuracoes/consultar-turmas`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| super_admin | Sim | Todas; filtro opcional `instituicao_id` |
| administrador | Sim | Todas da instituição |
| professor | Sim | Turmas onde é `professor_titular` |
| aluno | Sim | Turmas com matrícula ativa |
| responsavel | Sim | Turmas dos dependentes matriculados |

#### 3.1.6 Responsáveis e vínculos

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/configuracoes/consultar-responsaveis` | SA, Adm, P | SA: todos (`?instituicao_id=`); Adm: instituição; P: responsáveis de alunos do escopo |
| GET | `/configuracoes/consultar-responsavel/{id}` | SA, Adm, P | Escopo instituição / turmas titular |
| PUT | `/configuracoes/editar-responsavel/{id}` | Adm, P | Idem mutação |
| GET | `/configuracoes/consultar-responsaveis-aluno/{aluno_id}` | SA, Adm, P, A, R | A: próprio; R: dependentes; P: aluno no escopo |
| POST | `/configuracoes/vincular-responsavel-aluno/{aluno_id}` | Adm, P | Body: `{ responsavel_id, responsavel_principal? }` |
| DELETE | `/configuracoes/desvincular-responsavel-aluno/{aluno_id}/{responsavel_id}` | Adm, P | Remove vínculo |

**RN cadastros:**

- E-mail único por `(instituicao_id, lower(email))`
- Matrícula ativa única por aluno (409 se violar)
- Criar professor não concede turmas — associar via lotes ou `professor_titular_id` em turma (sincroniza N:N)
- Vários professores por turma: `POST /associar-professores-turma-lote`; professor em várias turmas: `PUT /associar-professor-turmas-lote`

---

### 3.2 AvaliacoesController (28 rotas + 4 IA futuras)

Arquivo: `backend/app/controllers/AvaliacoesController.py`

#### 3.2.1 Hierarquia docente (matérias → avaliações)

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/avaliacoes/consultar-materias` | Adm, P | Adm: todas da instituição; P: matérias da instituição |
| POST | `/avaliacoes/criar-materia` | Adm, P | Instituição do token |
| GET | `/avaliacoes/consultar-arvore-materia/{materia_id}` | Adm, P | Assuntos, pastas e contadores |
| PUT | `/avaliacoes/editar-materia/{materia_id}` | Adm, P | Instituição |
| DELETE | `/avaliacoes/apagar-materia/{materia_id}` | Adm, P | Instituição |
| POST | `/avaliacoes/criar-assunto/{materia_id}` | Adm, P | Filho da matéria |
| PUT | `/avaliacoes/editar-assunto/{assunto_id}` | Adm, P | Instituição |
| DELETE | `/avaliacoes/apagar-assunto/{assunto_id}` | Adm, P | Instituição |
| GET | `/avaliacoes/consultar-pasta/{pasta_id}` | Adm, P | Detalhe pasta + contadores derivados |
| POST | `/avaliacoes/criar-pasta/{assunto_id}` | Adm, P | Filho do assunto |
| PUT | `/avaliacoes/editar-pasta/{pasta_id}` | Adm, P | Instituição |
| GET | `/avaliacoes/consultar-avaliacoes-pasta/{pasta_id}` | Adm, P | Lista avaliações da pasta |
| POST | `/avaliacoes/criar-avaliacao/{pasta_id}` | Adm, P | Status inicial `rascunho` |
| GET | `/avaliacoes/consultar-avaliacao/{avaliacao_id}` | Adm, P | Detalhe completo com questões e gabarito |
| PUT | `/avaliacoes/editar-avaliacao/{avaliacao_id}` | Adm, P | Metadados (título, prazo); só `rascunho` para campos críticos |
| POST | `/avaliacoes/salvar-rascunho-avaliacao/{avaliacao_id}` | Adm, P | Auto-save idempotente |
| POST | `/avaliacoes/publicar-avaliacao/{avaliacao_id}` | Adm, P | `rascunho` → `publicada` |
| POST | `/avaliacoes/encerrar-avaliacao/{avaliacao_id}` | Adm, P | `publicada` → `encerrada` |
| POST | `/avaliacoes/inativar-avaliacao/{avaliacao_id}` | Adm, P | `publicada`/`encerrada` → `inativa` (soft-delete) |
| DELETE | `/avaliacoes/apagar-avaliacao/{avaliacao_id}` | Adm, P | Remove permanentemente (cascade) |
| POST | `/avaliacoes/duplicar-avaliacao/{avaliacao_id}` | Adm, P | Clone em `rascunho` com questões |
| POST | `/avaliacoes/reabrir-avaliacao/{avaliacao_id}` | Adm, P | `encerrada`/`inativa` → `publicada`; body opcional `{ prazo_utc }` |
| GET | `/avaliacoes/consultar-submissoes-avaliacao/{avaliacao_id}` | Adm, P | Lista alunos da turma + situação |
| GET | `/avaliacoes/consultar-submissao-avaliacao/{avaliacao_id}/{aluno_id}` | Adm, P | Respostas questão a questão (gabarito) |
| POST | `/avaliacoes/reabrir-submissao-aluno/{submissao_id}` | Adm, P | Reseta submissão do aluno (exceção) |
| PUT | `/avaliacoes/substituir-questoes-avaliacao/{avaliacao_id}` | Adm, P | Replace bulk; só `rascunho` |
| POST | `/avaliacoes/criar-questao/{avaliacao_id}` | Adm, P | Adiciona questão |
| PUT | `/avaliacoes/editar-questao/{avaliacao_id}/{questao_id}` | Adm, P | Só `rascunho` |
| DELETE | `/avaliacoes/apagar-questao/{avaliacao_id}/{questao_id}` | Adm, P | Só `rascunho` |
| POST | `/avaliacoes/reordenar-questoes/{avaliacao_id}` | Adm, P | Body: `{ questao_ids: UUID[] }` |

**RN publicar:** ≥1 questão válida; MCQ com ≥2 alternativas e gabarito válido.  
**RN encerrar:** fecha prova publicada; use `reabrir-avaliacao` para reativar.  
**RN inativar:** oculta da lista do aluno/responsável; dados preservados.  
**Contadores:** `total_submissoes` e `total_alunos_turma` por avaliação na árvore.

#### 3.2.2 Fluxo aluno (mesmo controller, alçada `aluno`)

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/avaliacoes/consultar-disponiveis` | A | Avaliações `publicada` das turmas ativas do aluno |
| GET | `/avaliacoes/consultar-avaliacao-resolver/{avaliacao_id}` | A | Sem gabarito; 404 se rascunho, encerrada ou fora do escopo |
| POST | `/avaliacoes/iniciar-submissao/{avaliacao_id}` | A | Cria submissão `rascunho` para o aluno autenticado |
| PUT | `/avaliacoes/atualizar-submissao/{submissao_id}` | A | Respostas parciais; submissão própria em `rascunho` |
| POST | `/avaliacoes/enviar-submissao/{submissao_id}` | A | Finaliza; dispara job `correcao_objetiva` |

##### Alçada: GET `/avaliacoes/consultar-disponiveis`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| aluno | Sim | Avaliações `publicada` vinculadas às turmas com matrícula ativa |
| Demais | Não | 403 |

**RN submissão:** UNIQUE `(avaliacao_id, aluno_id)`; validar `prazo_utc` em UTC; sem gabarito na view aluno.

#### 3.2.2.1 Fluxo responsável (mesmo controller, alçada `responsavel`)

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/avaliacoes/consultar-avaliacoes-dependente?aluno_id=` | R | Lista provas do dependente |
| GET | `/avaliacoes/consultar-avaliacao-dependente/{id}?aluno_id=` | R | Gabarito paginado; responsável vê respostas corretas mesmo em provas pendentes |

**Telas:** `/avaliacoes/*` (docente), `/aluno/provas/*` (aluno), `/responsavel/avaliacoes/*` (responsável)

#### 3.2.3 IA — fase futura (não implementada)

| Método | Path | Perfis | Escopo |
|--------|------|--------|--------|
| POST | `/avaliacoes/enviar-mensagem-chat/{avaliacao_id}` | Adm, P | Avaliação da instituição |
| GET | `/avaliacoes/consultar-chat/{avaliacao_id}` | Adm, P | Histórico do chat |
| GET | `/avaliacoes/consultar-relatorio-ia/{submissao_id}` | Adm, P, R, A | P/Adm: submissões da instituição; R: dependentes; A: própria |
| GET | `/avaliacoes/consultar-historico-relatorio-ia/{submissao_id}` | Adm, P, R, A | Versões do relatório |

---

### 3.3 ComunicadosController (6 rotas)

Arquivo: `backend/app/controllers/ComunicadosController.py`

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/comunicados/consultar-comunicados` | Adm, P, A, R | Ver alçada abaixo |
| GET | `/comunicados/consultar-comunicado/{id}` | Adm, P, A, R | Mesmo escopo |
| POST | `/comunicados/criar-comunicado` | Adm, P | Instituição do token |
| PUT | `/comunicados/editar-comunicado/{id}` | Adm, P | Autor ou Adm; só status `rascunho` |
| POST | `/comunicados/publicar-comunicado/{id}` | Adm, P | Autor ou Adm |
| POST | `/comunicados/marcar-comunicado-lido/{id}` | Adm, P, A, R | Destinatário no escopo |
| POST | `/comunicados/marcar-todos-comunicados-lidos` | Adm, P, A, R | Marca todos do inbox do usuário |
| GET | `/comunicados/consultar-leituras-comunicado/{id}` | Adm, P | Lista destinatários efetivos e status de leitura |

##### Alçada: GET `/comunicados/consultar-comunicados`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| administrador | Sim | Todos os comunicados da instituição (inclui rascunhos próprios/equipe) |
| professor | Sim | Publicados destinados + rascunhos/autoria própria |
| aluno | Sim | Comunicados publicados em que é destinatário efetivo |
| responsavel | Sim | Comunicados publicados para si ou dependentes |

**DestinatarioRef:** `{ tipo: aluno|turma|responsavel|professor, id }` — expandir turma na publicação; `professor` resolve para `usuario_id` do docente.

**Telas:** `/comunicados`, `/aluno/comunicados`

---

### 3.4 ConteudoController (10 rotas)

Arquivo: `backend/app/controllers/ConteudoController.py`

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/conteudo/consultar-pastas` | Adm, P, A | Ver alçada abaixo |
| POST | `/conteudo/criar-pasta` | Adm, P | Instituição; opcional `turma_id` |
| PUT | `/conteudo/editar-pasta/{pasta_id}` | Adm, P | Instituição |
| DELETE | `/conteudo/apagar-pasta/{pasta_id}` | Adm, P | Instituição |
| GET | `/conteudo/consultar-materiais/{pasta_id}` | Adm, P, A | Materiais da pasta visível |
| POST | `/conteudo/criar-material/{pasta_id}` | Adm, P | Tipos: pdf, audio, imagem, video, nota |
| GET | `/conteudo/consultar-material/{material_id}` | Adm, P, A | Material em pasta visível |
| PUT | `/conteudo/editar-material/{material_id}` | Adm, P | Instituição |
| DELETE | `/conteudo/apagar-material/{material_id}` | Adm, P | Instituição |
| POST | `/conteudo/gerar-url-upload` | Adm, P | Presign stub MVP (sem S3 real) |

##### Alçada: GET `/conteudo/consultar-pastas`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| administrador | Sim | Todas as pastas da instituição |
| professor | Sim | Pastas da instituição (CRUD) + leitura conforme turma |
| aluno | Sim | Pastas institucionais + pastas das turmas com matrícula ativa |

**Telas:** `/conteudo`, `/aluno/conteudo`

---

### 3.5 DashboardController (6 rotas)

Arquivo: `backend/app/controllers/DashboardController.py`

| Método | Path | Perfis | Escopo / descrição |
|--------|------|--------|-------------------|
| GET | `/dashboard/consultar-resumo` | SA, Adm, P, R | Ver alçada abaixo |
| GET | `/dashboard/consultar-series` | SA, Adm, P, R | Séries temporais; mesmo escopo do resumo |
| GET | `/dashboard/consultar-desempenho-avaliacoes` | SA, Adm, P, R | Árvore matéria → assunto → avaliações com % (submissões reais) |
| GET | `/dashboard/buscar` | Adm, P, A, R | Busca federada; escopo por perfil |
| GET | `/dashboard/consultar-notificacoes` | autenticado | Inbox do próprio usuário |
| PUT | `/dashboard/marcar-notificacao-lida/{id}` | autenticado | Notificação própria |
| POST | `/dashboard/marcar-todas-notificacoes-lidas` | autenticado | Bulk do próprio usuário |

**Query resumo/séries:** `escopo`, `turma_id`, `aluno_id`, `data_inicio`, `data_fim`

##### Alçada: GET `/dashboard/consultar-resumo`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| super_admin | Sim | Agregados globais da plataforma (não pedagógico por turma) |
| administrador | Sim | Métricas de toda a instituição |
| professor | Sim | Métricas das turmas onde é titular |
| responsavel | Sim | Métricas dos dependentes vinculados |
| aluno | Não | 403 |

##### Alçada: GET `/dashboard/buscar`

| Perfil | Pode chamar? | Dados retornados |
|--------|:------------:|------------------|
| administrador | Sim | Todos os tipos indexados na instituição |
| professor | Sim | Materiais, turmas, alunos do escopo |
| aluno | Sim | Tipos restritos (conteúdo, comunicados) |
| responsavel | Sim | Tipos restritos (comunicados, dependentes) |

**SearchHit:** `{ id, tipo, titulo, subtitulo, url_deep_link }`  
Query: `q` (min 2 chars), `types` CSV

**Telas:** `/dashboard`, cabeçalho global (busca e notificações)

---

### 3.6 Mapa controller → domínio

| Arquivo | Prefixo | Rotas |
|---------|---------|-------|
| `ConfiguracoesController.py` | `/configuracoes/` | 35 |
| `AvaliacoesController.py` | `/avaliacoes/` | 28 (+ 4 IA) |
| `ComunicadosController.py` | `/comunicados/` | 6 |
| `ConteudoController.py` | `/conteudo/` | 10 |
| `DashboardController.py` | `/dashboard/` | 6 |
| **Total operacional** | | **85** |
| **Total com IA reservada** | | **89** |

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
6. **IA:** chat só professor/administrador; relatório versionado pós-envio
7. **Privacidade:** responsável só dependentes em `aluno_responsavel`
8. **Alçada única:** um endpoint por operação; filtro por perfil no serviço — nunca duplicar rota por perfil
9. **Sem PATCH:** toda mutação parcial usa PUT com DTO de campos opcionais

---

## 6. Jobs assíncronos

| Fila | Gatilho (v2.0) |
|------|----------------|
| `correcao_objetiva` | `POST /avaliacoes/enviar-submissao/{id}` |
| `relatorio_ia` | Após correção objetiva |
| `expiracao_avaliacao` | Cron opcional pós `prazo_utc` |
| `reindexacao_search` | CRUD títulos/comunicados |
| `reconciliar_contadores_pasta` | Periódico se sem view materializada |

---

## 7. Mapeamento RF → endpoints (v2.0)

| RF | Endpoints |
|----|-----------|
| RF-001 | `/dashboard/buscar`, `/dashboard/consultar-notificacoes*`, `/configuracoes/consultar-perfil`, `/configuracoes/atualizar-preferencias` |
| RF-002 | Middleware global + alçada por perfil |
| RF-003–004 | `/conteudo/*`, `/conteudo/gerar-url-upload` |
| RF-005–009, 017 | `/avaliacoes/*` |
| RF-010–011 | `/comunicados/*` |
| RF-012–014 | `/dashboard/consultar-resumo`, `/avaliacoes/consultar-relatorio-ia/*` |
| RF-018–019 | `/configuracoes/autenticar`, `/configuracoes/renovar-token`, `/configuracoes/encerrar-sessao` |
| RF-020–021, 024 | `/configuracoes/consultar-instituicoes*`, `/configuracoes/consultar-professores*`, `/configuracoes/consultar-alunos*`, `/configuracoes/consultar-turmas*` |

---

## 8. Mapa de migração v1.2 → v2.0

| v1.2 | v2.0 |
|------|------|
| `POST /auth/login` | `POST /configuracoes/autenticar` |
| `POST /auth/refresh` | `POST /configuracoes/renovar-token` |
| `POST /auth/logout` | `POST /configuracoes/encerrar-sessao` |
| `GET /auth/me` | `GET /configuracoes/consultar-perfil` |
| `PATCH /users/me/preferences` | `PUT /configuracoes/atualizar-preferencias` |
| `GET /admin/instituicoes` | `GET /configuracoes/consultar-instituicoes` |
| `POST /admin/instituicoes` | `POST /configuracoes/criar-instituicao` |
| `GET /admin/instituicoes/{id}` | `GET /configuracoes/consultar-instituicao/{id}` |
| `PATCH /admin/instituicoes/{id}` | `PUT /configuracoes/editar-instituicao/{id}` |
| `GET /super-admin/professores` | `GET /configuracoes/consultar-professores?instituicao_id=` |
| `GET /super-admin/turmas` | `GET /configuracoes/consultar-turmas?instituicao_id=` |
| `GET /super-admin/resumo` | `GET /configuracoes/consultar-resumo-plataforma` |
| `GET /instituicoes/{id}` | `GET /configuracoes/consultar-minha-instituicao` ou `consultar-instituicao/{id}` |
| `PATCH /instituicoes/{id}` | `PUT /configuracoes/editar-instituicao/{id}` |
| `GET /cadastros/professores` | `GET /configuracoes/consultar-professores` |
| `POST /cadastros/professores` | `POST /configuracoes/criar-usuario` (`tipo_perfil=professor`) |
| `GET /cadastros/professores/{id}` | `GET /configuracoes/consultar-professor/{id}` |
| `PATCH /cadastros/professores/{id}` | `PUT /configuracoes/editar-professor/{id}` |
| `DELETE /cadastros/professores/{id}` | `DELETE /configuracoes/desativar-professor/{id}` |
| `GET /cadastros/alunos` | `GET /configuracoes/consultar-alunos` |
| `POST /cadastros/alunos` | `POST /configuracoes/criar-usuario` (`tipo_perfil=aluno`) |
| `GET /cadastros/alunos/{id}` | `GET /configuracoes/consultar-aluno/{id}` |
| `PATCH /cadastros/alunos/{id}` | `PUT /configuracoes/editar-aluno/{id}` |
| `GET /cadastros/responsaveis` | `GET /configuracoes/consultar-responsaveis` |
| `POST /cadastros/responsaveis` | `POST /configuracoes/criar-usuario` (`tipo_perfil=responsavel`) |
| `GET /cadastros/responsaveis/{id}` | `GET /configuracoes/consultar-responsavel/{id}` |
| `POST /cadastros/alunos/{id}/responsaveis` | `POST /configuracoes/vincular-responsavel-aluno/{aluno_id}` |
| `DELETE /cadastros/alunos/{id}/responsaveis/{rid}` | `DELETE /configuracoes/desvincular-responsavel-aluno/{aluno_id}/{rid}` |
| `GET /cadastros/turmas` | `GET /configuracoes/consultar-turmas` |
| `POST /cadastros/turmas` | `POST /configuracoes/criar-turma` |
| `GET /cadastros/turmas/{id}` | `GET /configuracoes/consultar-turma/{id}` |
| `PATCH /cadastros/turmas/{id}` | `PUT /configuracoes/editar-turma/{id}` |
| `POST /cadastros/matriculas` | `POST /configuracoes/criar-matricula` |
| `PATCH /cadastros/matriculas/{id}` | `PUT /configuracoes/editar-matricula/{id}` |
| `GET /turmas` | `GET /configuracoes/consultar-turmas` |
| `GET /turmas/{id}` | `GET /configuracoes/consultar-turma/{id}` |
| `GET /turmas/{id}/alunos` | `GET /configuracoes/consultar-alunos-turma/{turma_id}` |
| `GET /alunos/{id}` | `GET /configuracoes/consultar-aluno/{id}` |
| `GET /alunos/{id}/responsaveis` | `GET /configuracoes/consultar-responsaveis-aluno/{aluno_id}` |
| `GET /avaliacoes/materias` | `GET /avaliacoes/consultar-materias` |
| `POST /avaliacoes/materias` | `POST /avaliacoes/criar-materia` |
| `PATCH /avaliacoes/materias/{id}` | `PUT /avaliacoes/editar-materia/{id}` |
| `DELETE /avaliacoes/materias/{id}` | `DELETE /avaliacoes/apagar-materia/{id}` |
| `GET /avaliacoes/materias/{id}/arvore` | `GET /avaliacoes/consultar-arvore-materia/{id}` |
| `POST /avaliacoes/materias/{id}/assuntos` | `POST /avaliacoes/criar-assunto/{materia_id}` |
| `PATCH /avaliacoes/assuntos/{id}` | `PUT /avaliacoes/editar-assunto/{id}` |
| `DELETE /avaliacoes/assuntos/{id}` | `DELETE /avaliacoes/apagar-assunto/{id}` |
| `POST /avaliacoes/assuntos/{id}/pastas` | `POST /avaliacoes/criar-pasta/{assunto_id}` |
| `GET /avaliacoes/pastas/{id}` | `GET /avaliacoes/consultar-pasta/{id}` |
| `PATCH /avaliacoes/pastas/{id}` | `PUT /avaliacoes/editar-pasta/{id}` |
| `GET /avaliacoes/pastas/{id}/avaliacoes` | `GET /avaliacoes/consultar-avaliacoes-pasta/{id}` |
| `POST /avaliacoes/pastas/{id}/avaliacoes` | `POST /avaliacoes/criar-avaliacao/{pasta_id}` |
| `GET /avaliacoes/avaliacoes/{id}` | `GET /avaliacoes/consultar-avaliacao/{id}` |
| `PATCH /avaliacoes/avaliacoes/{id}` | `PUT /avaliacoes/editar-avaliacao/{id}` |
| `POST .../salvar-rascunho` | `POST /avaliacoes/salvar-rascunho-avaliacao/{id}` |
| `POST .../publicar` | `POST /avaliacoes/publicar-avaliacao/{id}` |
| `POST .../encerrar` | `POST /avaliacoes/encerrar-avaliacao/{id}` |
| `PUT .../questoes` | `PUT /avaliacoes/substituir-questoes-avaliacao/{id}` |
| `POST .../questoes` | `POST /avaliacoes/criar-questao/{avaliacao_id}` |
| `PATCH .../questoes/{qid}` | `PUT /avaliacoes/editar-questao/{avaliacao_id}/{qid}` |
| `DELETE .../questoes/{qid}` | `DELETE /avaliacoes/apagar-questao/{avaliacao_id}/{qid}` |
| `POST .../questoes/reordenar` | `POST /avaliacoes/reordenar-questoes/{avaliacao_id}` |
| `GET /aluno/avaliacoes/disponiveis` | `GET /avaliacoes/consultar-disponiveis` |
| `GET /aluno/avaliacoes/{id}` | `GET /avaliacoes/consultar-avaliacao-resolver/{id}` |
| `POST /aluno/avaliacoes/{id}/submissoes` | `POST /avaliacoes/iniciar-submissao/{avaliacao_id}` |
| `PATCH /aluno/submissoes/{id}` | `PUT /avaliacoes/atualizar-submissao/{id}` |
| `POST /aluno/submissoes/{id}/enviar` | `POST /avaliacoes/enviar-submissao/{id}` |
| `GET /comunicados` | `GET /comunicados/consultar-comunicados` |
| `GET /comunicados/{id}` | `GET /comunicados/consultar-comunicado/{id}` |
| `POST /comunicados` | `POST /comunicados/criar-comunicado` |
| `PATCH /comunicados/{id}` | `PUT /comunicados/editar-comunicado/{id}` |
| `POST /comunicados/{id}/publicar` | `POST /comunicados/publicar-comunicado/{id}` |
| `POST /comunicados/{id}/marcar-lido` | `POST /comunicados/marcar-comunicado-lido/{id}` |
| `GET /conteudo/pastas` | `GET /conteudo/consultar-pastas` |
| `POST /conteudo/pastas` | `POST /conteudo/criar-pasta` |
| `PATCH /conteudo/pastas/{id}` | `PUT /conteudo/editar-pasta/{id}` |
| `DELETE /conteudo/pastas/{id}` | `DELETE /conteudo/apagar-pasta/{id}` |
| `GET /conteudo/pastas/{id}/materiais` | `GET /conteudo/consultar-materiais/{pasta_id}` |
| `POST /conteudo/pastas/{id}/materiais` | `POST /conteudo/criar-material/{pasta_id}` |
| `GET /conteudo/materiais/{id}` | `GET /conteudo/consultar-material/{id}` |
| `PATCH /conteudo/materiais/{id}` | `PUT /conteudo/editar-material/{id}` |
| `DELETE /conteudo/materiais/{id}` | `DELETE /conteudo/apagar-material/{id}` |
| `POST /uploads/presign` | `POST /conteudo/gerar-url-upload` |
| `GET /dashboard/resumo` | `GET /dashboard/consultar-resumo` |
| `GET /dashboard/series` | `GET /dashboard/consultar-series` |
| `GET /search` | `GET /dashboard/buscar` |
| `GET /notificacoes` | `GET /dashboard/consultar-notificacoes` |
| `PATCH /notificacoes/{id}/lida` | `PUT /dashboard/marcar-notificacao-lida/{id}` |
| `POST /notificacoes/marcar-todas-lidas` | `POST /dashboard/marcar-todas-notificacoes-lidas` |
| `POST /avaliacoes/avaliacoes/{id}/chat` | `POST /avaliacoes/enviar-mensagem-chat/{id}` |
| `GET /avaliacoes/avaliacoes/{id}/chat` | `GET /avaliacoes/consultar-chat/{id}` |
| `GET /submissoes/{id}/relatorio-ia` | `GET /avaliacoes/consultar-relatorio-ia/{submissao_id}` |
| `GET /submissoes/{id}/relatorio-ia/historico` | `GET /avaliacoes/consultar-historico-relatorio-ia/{submissao_id}` |

---

## Referências

- Domínio e RBAC: [03-dominio-entidades-e-rbac.md](./03-dominio-entidades-e-rbac.md)
- Tabelas: [04-modelo-de-dados.md](./04-modelo-de-dados.md)
- UI por perfil: [06-modulos-interface-por-perfil.md](./06-modulos-interface-por-perfil.md)
- Fluxos configurações: [08-configuracoes-sistema.md](./08-configuracoes-sistema.md)
- Roadmap implementação: [11-roadmap-desenvolvimento.md](./11-roadmap-desenvolvimento.md)
