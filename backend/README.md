# EduSaaS Backend

API FastAPI + PostgreSQL v2.0 — 5 controllers REST na raiz do servidor (sem `/api/v1`).

## Subir com Docker

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build
```

Variáveis principais no `.env` da raiz: `POSTGRES_HOST_PORT=5434`, `FRONTEND_PORT=3000`, `BACKEND_PORT=8000`.

Se a porta 3000 já estiver em uso (ex.: `next dev` local), altere `FRONTEND_PORT` e `CORS_ORIGINS` no `.env`, ou pare o processo que ocupa a porta.

Na primeira execução, após consolidar migrations ou se `alembic upgrade` falhar, recrie o volume:

```bash
docker compose down -v
docker compose up --build
```

O container backend roda `alembic upgrade head` automaticamente antes de subir o uvicorn (ver `command:` no `docker-compose.yml`), então o schema e os dados demo são criados no primeiro startup. O upgrade é idempotente e seguro a cada restart.

Para aplicar migrations manualmente (ex.: dev local fora do Docker):

```bash
docker compose exec backend alembic upgrade head
```

### Dev rápido no Windows

Para compilação e HMR mais rápidos, suba só DB + backend no Docker e rode o frontend **nativo** no host:

```bash
docker compose up db backend
cd frontend && npm ci && npm run dev
```

Defina `NEXT_PUBLIC_API_URL=http://localhost:8000` no ambiente do frontend (ou `.env.local`).

Se usar o frontend no Docker com bind mount no Windows e o HMR falhar, defina `FRONTEND_USE_POLLING=true` no `.env`.

- Frontend: http://localhost:3000 (ou valor de `FRONTEND_PORT`)
- API: http://localhost:8000
- Health: http://localhost:8000/health (503 se banco indisponível)
- Docs (dev): http://localhost:8000/docs
- Base REST: http://localhost:8000 (ex.: `/configuracoes/autenticar`)
- Postgres (DBeaver/host): `localhost:5434` — usuário/senha/banco `edusaas`

## Bootstrap demo — usuários, emails e senhas

Os usuários demo são criados pela migration Alembic `002` (que chama `scripts/demo_bootstrap.py`).
**A senha é a mesma para TODOS os usuários: `admin123`** (constante `DEMO_PASSWORD`).

Para re-sincronizar dados demo sem recriar o volume: `python -m scripts.seed`

| Email | Senha | Perfil | Nome de exibição | Acesso |
|-------|-------|--------|------------------|--------|
| admin@edu.com.br | admin123 | super_admin | Admin Plataforma Edu | `/super-admin` (login principal da plataforma) |
| gestor@edu.com.br | admin123 | administrador | Gestor da Escola | `/configuracoes` (Escola Demo Edu) |
| professor@edu.com.br | admin123 | professor | Prof. Maria Silva | `/conteudo`, `/avaliacoes` (Matemática, Ciências) |
| professor2@edu.com.br | admin123 | professor | Prof. João Santos | `/conteudo` (Português) |
| aluno@edu.com.br | admin123 | aluno | Pedro Aluno | `/aluno/provas` (turma 3º Ano A) |
| aluno2@edu.com.br | admin123 | aluno | Ana Aluna | `/aluno/provas` (turma 3º Ano A) |
| responsavel@edu.com.br | admin123 | responsavel | Carla Responsável | `/dashboard` (responsável de aluno@edu.com.br) |

> **Atenção:** o `admin@edu.com.br` (super_admin) é o único usuário **sem instituição** (`instituicao_id = NULL`); os demais pertencem à **Escola Demo Edu**.

## Troubleshooting — login retorna 500 (`relation "usuario_conta" does not exist`)

Se o login falhar com erro 500 e o log mostrar:

```
psycopg.errors.UndefinedTable: relation "usuario_conta" does not exist
```

o banco está **sem schema** — as migrations Alembic não foram aplicadas. Desde a correção no `docker-compose.yml`, o backend roda `alembic upgrade head` automaticamente no startup; se ainda assim ocorrer, aplique manualmente:

```bash
docker compose exec backend alembic upgrade head
```

Se persistir (volume em estado inconsistente), recrie do zero:

```bash
docker compose down -v
docker compose up --build
docker compose exec backend alembic upgrade head
```

Instituição de teste: **Escola Demo Edu** — turma 3º Ano A, matérias (Matemática, Português, Ciências) com assuntos, materiais de conteúdo e comunicado de exemplo. **Avaliações não são pré-criadas** — crie-as pela UI em `/avaliacoes` para testar provas.

## Teste rápido (curl)

```bash
curl -s http://localhost:8000/health

curl -s -X POST http://localhost:8000/configuracoes/autenticar \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edu.com.br","senha":"admin123"}'

# Use access_token retornado:
curl -s http://localhost:8000/configuracoes/consultar-perfil \
  -H "Authorization: Bearer <access_token>"

curl -s http://localhost:8000/avaliacoes/consultar-materias \
  -H "Authorization: Bearer <access_token>"
```

## Estrutura da API

```
app/
├── main.py                 # FastAPI + /health + routers v2
├── api/deps.py             # JWT, CurrentUser, RBAC
├── controllers/            # Rotas finas (5 controllers)
├── services/               # Regras de negócio
└── schemas/                # DTOs Pydantic v2
```

| Controller | Responsabilidade |
|------------|------------------|
| `ConfiguracoesController.py` | Auth, cadastros, instituição, super admin (`/configuracoes/*`) |
| `AvaliacoesController.py` | Hierarquia avaliações + fluxo aluno (`/avaliacoes/*`) |
| `ConteudoController.py` | Pastas, materiais, upload (`/conteudo/*`) |
| `ComunicadosController.py` | Inbox, publicação, leitura (`/comunicados/*`) |
| `DashboardController.py` | Resumo, busca, notificações (`/dashboard/*`) |

**Adiado:** `IAController.py` — chat do editor e relatórios IA (4 rotas). Ver [Docs/07-api-contrato-backend.md](../Docs/07-api-contrato-backend.md) § 3.11.

## Variáveis de ambiente

Ver `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`, `CORS_ORIGINS`.

## Desenvolvimento local

```bash
cd backend
pip install -e .
cp .env.example .env
# Ajuste DATABASE_URL para localhost:5434 se o Postgres estiver no Docker
alembic upgrade head
python -m scripts.seed   # opcional; migration 002 já inclui demo bootstrap
uvicorn app.main:app --reload
```

## Modelo de dados

27 tabelas conforme [Docs/04-modelo-de-dados.md](../Docs/04-modelo-de-dados.md).

Contrato REST: [Docs/07-api-contrato-backend.md](../Docs/07-api-contrato-backend.md).
