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

Na primeira execução ou após mudar credenciais do banco, recrie o volume:

```bash
docker compose down -v
docker compose up --build
```

- Frontend: http://localhost:3000 (ou valor de `FRONTEND_PORT`)
- API: http://localhost:8000
- Health: http://localhost:8000/health (503 se banco indisponível)
- Docs (dev): http://localhost:8000/docs
- Base REST: http://localhost:8000 (ex.: `/configuracoes/autenticar`)
- Postgres (DBeaver/host): `localhost:5434` — usuário/senha/banco `edusaas`

## Bootstrap demo

Executado via migration Alembic `003` e re-sincronizado no startup do container (`python -m scripts.seed`). Senha padrão: **admin123**

| Email | Perfil |
|-------|--------|
| admin@edu.com.br | super_admin (login principal da plataforma) |
| gestor@edu.com.br | administrador (Escola Demo Edu) |
| professor@edu.com.br | professor |
| professor2@edu.com.br | professor |
| aluno@edu.com.br | aluno |
| aluno2@edu.com.br | aluno |
| responsavel@edu.com.br | responsavel |

Instituição de teste: **Escola Demo Edu** — turma 3º Ano A, matérias (Matemática, Português, Ciências), avaliações, materiais de conteúdo e comunicado de exemplo.

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
# Ajuste DATABASE_URL para localhost se o Postgres estiver no Docker
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

## Modelo de dados

27 tabelas conforme [Docs/04-modelo-de-dados.md](../Docs/04-modelo-de-dados.md).

Contrato REST: [Docs/07-api-contrato-backend.md](../Docs/07-api-contrato-backend.md).
