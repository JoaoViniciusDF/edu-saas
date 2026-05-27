# Visão do produto e escopo do MVP

## Visão executiva

O EduSaaS é um **Sistema de Gestão e Observabilidade Educacional** que vai além da digitalização de sala de aula. O núcleo oferece ao corpo docente:

- **Controle em tempo real** e observabilidade do engajamento estudantil
- **Repositório didático** organizado por disciplinas e tipos de mídia
- **Motor de avaliações** hierárquico (matéria → assunto → pasta → prova) com assistente de IA em coautoria (sidecar)
- **Comunicação institucional** segmentada (alunos e/ou responsáveis)
- **Dashboard AI** com métricas, tendências e insights acionáveis

Após cada avaliação concluída, a telemetria retroalimenta relatórios de desempenho (incluindo narrativa gerada por LLM), com transparência controlada para responsáveis legais.

## Estado atual do repositório

| Camada | Situação |
|--------|----------|
| Frontend Next.js 16 | UI do **professor** com quatro módulos; dados **mock** em memória |
| Backend FastAPI | **Não implementado** (pasta `backend/` ausente) |
| Autenticação / RBAC | **Não implementado** |
| Persistência PostgreSQL | Especificada; migrations pendentes |

A interface demonstra navegação, hierarquia de avaliações, estados de prova, comunicados e painel analítico. JWT, API, filas e blob storage são **arquitetura alvo**, não produção atual.

## Módulos do produto

### Módulos pedagógicos (UI existente — professor)

| Módulo | Rota | Função |
|--------|------|--------|
| Conteúdo | `/conteudo` | Pastas por disciplina; materiais PDF, áudio, imagem, vídeo, nota |
| Avaliações | `/avaliacoes/*` | Hierarquia matéria/assunto/pasta; editor com sidecar IA (mock) |
| Comunicados | `/comunicados` | Caixa de entrada; emissão segmentada |
| Dashboard AI | `/dashboard` | Cartões, gráficos, insights (regras locais, sem LLM real) |

### Módulos a desenvolver

| Módulo | Rota planejada | Função |
|--------|----------------|--------|
| Login | `/login` | Autenticação e roteamento por perfil |
| Configurações | `/configuracoes/*` | Cadastros institucionais (admin) |
| Super Admin | `/super-admin/*` | Visão cross-tenant da plataforma |
| Área do aluno | `/aluno/*` | Materiais + **Minhas provas** |
| Área do responsável | `/responsavel/*` ou rotas compartilhadas | Dashboard e comunicados (leitura) |

## Perfis de usuário (visão de produto)

Cinco papéis operacionais — detalhes em [03-dominio-entidades-e-rbac.md](./03-dominio-entidades-e-rbac.md):

1. **Super Admin** — operador da plataforma SaaS; vê todas as instituições, professores e turmas
2. **Administrador** — diretor/dono da escola; acesso total na instituição + cadastros
3. **Professor** — domínio pedagógico nas turmas vinculadas
4. **Responsável** — leitura sobre dependentes
5. **Aluno** — consumo de conteúdo e submissão de provas

## Dentro do escopo MVP

- Multi-tenant por `instituicao_id`
- Cadastro institucional: professores, turmas, alunos, responsáveis, matrículas e vínculos
- Login JWT (access + refresh)
- RBAC em API e rotas do frontend
- Avaliações: rascunho → publicada → encerrada; submissão única por aluno/prova
- Conteúdo e comunicados persistidos
- Dashboard com agregações reais (insights podem começar com regras + stub de LLM)
- Relatório IA: fila assíncrona (integração LLM real ou stub documentado)
- Busca federada e notificações (fase final do roadmap)

## Fora do escopo MVP (pós-MVP)

- Drag-and-drop para reordenar/mover avaliações entre pastas
- Múltiplos professores titulares por turma (N:N `turma_professor`)
- Entidade **sala física** separada de turma (ver [04-modelo-de-dados.md](./04-modelo-de-dados.md))
- WebSocket/SSE obrigatório no chat IA (sync HTTP aceitável no MVP)
- App mobile nativo
- Billing e planos comerciais
- SSO/OAuth federado (apenas e-mail/senha no MVP)

## Referências

- Especificação completa: [frontend/docs/especificacao-de-requisitos.txt](../frontend/docs/especificacao-de-requisitos.txt)
- Requisitos rastreáveis: [05-requisitos-funcionais.md](./05-requisitos-funcionais.md)
- Roadmap de entrega: [11-roadmap-desenvolvimento.md](./11-roadmap-desenvolvimento.md)
