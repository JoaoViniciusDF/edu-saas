# EduSaaS Backend

API FastAPI + PostgreSQL — entidades (F0) e camada REST `/api/v1` (controllers + services).

## Subir com Docker

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build
```

Variáveis principais no `.env` da raiz: `POSTGRES_HOST_PORT=5434`, `FRONTEND_PORT=3001`, `BACKEND_PORT=8000`.

Se a porta 3000 ou 5432 já estiver em uso no Windows, altere `FRONTEND_PORT` ou `POSTGRES_HOST_PORT` no `.env`.

Na primeira execução ou após mudar credenciais do banco, recrie o volume:

```bash
docker compose down -v
docker compose up --build
```

- Frontend: http://localhost:3001 (ou valor de `FRONTEND_PORT`)
- API: http://localhost:8000
- Health: http://localhost:8000/health
- Docs (dev): http://localhost:8000/docs
- Base REST: http://localhost:8000/api/v1
- Postgres (DBeaver/host): `localhost:5434` — usuário/senha/banco `edusaas`

## Seed demo

Executado automaticamente no startup do container. Senha padrão: **Demo@2026**

| Email | Perfil |
|-------|--------|
| super@edusaas.local | super_admin |
| admin@demo.edusaas | administrador |
| professor@demo.edusaas | professor |
| aluno@demo.edusaas | aluno |
| responsavel@demo.edusaas | responsavel |

## Teste rápido (curl)

```bash
curl -s http://localhost:8000/health

curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@demo.edusaas","senha":"Demo@2026"}'

# Use access_token retornado:
curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

## Estrutura da API

```
app/
├── main.py                 # FastAPI + /health + /api/v1
├── api/deps.py             # JWT, CurrentUser, RBAC
├── controllers/            # Rotas finas (5 controllers)
├── services/               # Regras de negócio
└── schemas/                # DTOs Pydantic v2
```

| Controller | Responsabilidade |
|------------|------------------|
| `ConfiguracoesController.py` | Auth, admin, cadastros, turmas/alunos |
| `AvaliacoesController.py` | Hierarquia avaliações + fluxo aluno |
| `ConteudoController.py` | Pastas, materiais, presign (stub) |
| `ComunicadosController.py` | Inbox, publicação, leitura |
| `DashboardController.py` | Resumo, busca, notificações |

**Adiado:** `IAController.py` — chat do editor e relatórios IA (4 rotas). Ver [Docs/07-api-contrato-backend.md](../Docs/07-api-contrato-backend.md) § 3.11.

## Variáveis de ambiente

Ver `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`, `CORS_ORIGINS`.

## Desenvolvimento local

```bash
cd backend
pip install -e .
cp .env.example .env
# Ajuste DATABASE_URL para localhost se o Postgres estiver no Docker
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

## Modelo de dados

27 tabelas conforme [Docs/04-modelo-de-dados.md](../Docs/04-modelo-de-dados.md).

Contrato REST: [Docs/07-api-contrato-backend.md](../Docs/07-api-contrato-backend.md).
