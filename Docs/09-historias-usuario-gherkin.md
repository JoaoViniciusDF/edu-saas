# Histórias de usuário (Gherkin)

Cenários para alinhamento produto/engenharia/QA. Sintaxe Gherkin em português.

Fonte original: [frontend/docs/especificacao-de-requisitos.txt](../frontend/docs/especificacao-de-requisitos.txt) (Épicos 1–4). Épicos 5–7 são extensões desta documentação.

---

## Épico 1 — Gestão de acesso e navegação

### HU 1.1 — Autenticação via RBAC

**Como** usuário do domínio escolar  
**Quero** autenticar-me com credenciais seguras  
**Para** acessar ferramentas coerentes com o meu perfil

```gherkin
Cenário: Autenticação bem-sucedida e roteamento por perfil
  Dado que acesso a página de login
  Quando insiro e-mail e senha válidos
  E confirmo o envio
  Então o servidor valida o hash e emite tokens JWT
  E associa o contexto RBAC ao usuário
  E redireciono o Professor para /conteudo
  E redireciono o Aluno para /aluno/provas
  E redireciono o Administrador para /dashboard
  E redireciono o Super Admin para /super-admin
```

```gherkin
Cenário: Credenciais inválidas
  Dado que estou na página de login
  Quando insiro senha incorreta
  Então recebo erro 401 com mensagem legível
  E permaneço na página de login
```

### HU 1.2 — Busca global federada

```gherkin
Cenário: Resultados agrupados por tipo
  Dado que sou Professor autenticado
  E o índice de busca está disponível
  Quando digito um termo na barra superior e confirmo
  Então o backend retorna correspondências em alunos, materiais, avaliações e comunicados no meu escopo
  E a UI apresenta lista agrupada com links para cada registro
```

### HU 1.3 — Navegação responsiva

```gherkin
Cenário: Painel lateral móvel
  Dado que a viewport aciona layout compacto
  Quando aciono o controle de menu
  Então um painel lateral exibe os mesmos itens da sidebar desktop permitidos ao meu perfil
  E ao tocar em um módulo o painel fecha e a rota carrega
```

### HU 1.4 — Tema claro e escuro

```gherkin
Cenário: Persistência da preferência
  Dado que estou autenticado em qualquer módulo
  Quando alterno o tema no cabeçalho
  Então a interface aplica o esquema correspondente
  E a preferência é enviada ao servidor via PATCH /users/me/preferences
  E permanece nas visitas subsequentes
```

---

## Épico 2 — Avaliações e assistente IA

### HU 2.1 — Edição híbrida (copilot)

```gherkin
Cenário: Sugestões incorporadas ao conjunto de questões
  Dado que o editor dividido está aberto com avaliação em rascunho
  Quando envio instruções naturais ao assistente lateral
  Então o sistema integra questões propostas no painel principal
  E permite desfazer ou ajustar manualmente cada item
```

### HU 2.2 — Expiração e bloqueio

```gherkin
Cenário: Bloqueio após instante de encerramento
  Dado avaliação publicada com prazo_utc definido
  E um aluno autenticado com submissão em rascunho
  Quando o instante UTC ultrapassa o limite
  Então POST /aluno/submissoes/{id}/enviar retorna 403
  E a UI exibe indisponibilidade por prazo expirado
```

### HU 2.3 — Hierarquia matéria, assunto e pasta

```gherkin
Cenário: Nova matéria e pasta
  Dado que estou na listagem de avaliações
  Quando confirmo diálogo de nova matéria com nome válido
  Então o sistema cria matéria com assunto inicial "Geral"
  E permite adicionar pasta de avaliações no assunto
```

### HU 2.4 — Publicação e encerramento

```gherkin
Cenário: Transições de estado válidas
  Dado avaliação em rascunho com ao menos uma questão válida
  Quando publico a avaliação
  Então alunos da turma escopada visualizam na lista de provas
  Quando encerro a avaliação
  Então novas respostas são rejeitadas
  E notas consolidadas permanecem auditáveis
```

---

## Épico 3 — Observabilidade e relatórios

### HU 3.1 — Relatório qualitativo pós-submissão

```gherkin
Cenário: Persistência e notificação do relatório
  Dado que o aluno concluiu a submissão
  Quando o backend finaliza correção objetiva e o job de IA conclui
  Então o relatório fica armazenado em relatorio_ia
  E é visível ao responsável vinculado
  E uma notificação pode aparecer no painel do responsável
```

### HU 3.2 — Indicadores no dashboard

```gherkin
Cenário: Cartões e gráficos coerentes
  Dado submissões e notas no período filtrado
  Quando abro o Dashboard AI como professor
  Então visualizo séries temporais e comparativos por disciplina
  E insights destacam anomalias ou oportunidades de revisão
```

---

## Épico 4 — Comunicação e materiais

### HU 4.1 — Comunicado segmentado

```gherkin
Cenário: Destinatários explícitos
  Dado diálogo de novo comunicado aberto
  Quando preencho título e corpo e marco público Alunos e/ou Responsáveis
  Então o comunicado é registrado com segmentação correta
  E usuários fora do público não o visualizam na inbox
```

### HU 4.2 — Material didático por tipo

```gherkin
Cenário: Modal de visualização
  Dado material na lista da pasta de disciplina
  Quando abro o material
  Então o modal exibe título, metadados e conteúdo coerente com o tipo
  E posso fechar retornando à lista sem perder contexto
```

---

## Épico 5 — Configuração institucional (NOVO)

### HU 5.1 — Cadastrar turma e matricular alunos

**Como** administrador da escola  
**Quero** criar turmas e matricular alunos  
**Para** organizar a operação antes das avaliações

```gherkin
Cenário: Turma com matrículas ativas
  Dado que estou autenticado como administrador
  Quando crio turma "3º Ano A" com ano letivo 2026
  E matricula alunos João e Maria na turma
  Então existem duas matrículas com situacao ativa
  E o professor titular vê dois alunos em GET /turmas/{id}/alunos
```

### HU 5.2 — Vincular responsável ao aluno

```gherkin
Cenário: Responsável principal
  Dado aluno cadastrado
  Quando vinculo responsável Ana como responsavel_principal
  Então comunicados críticos para responsáveis podem priorizar Ana
  E Ana acessa dashboard do dependente
```

---

## Épico 6 — Super Admin multi-tenant (NOVO)

### HU 6.1 — Visão cross-tenant de professores

**Como** super administrador da plataforma  
**Quero** listar professores de todas as instituições  
**Para** auditar adoção e suporte

```gherkin
Cenário: Lista filtrada por instituição
  Dado que estou autenticado como super_admin
  Quando acesso listagem de professores sem filtro
  Então vejo professores de todas as instituições com coluna instituição
  Quando aplico filtro instituicao_id da Escola Alpha
  Então vejo apenas professores da Escola Alpha
```

### HU 6.2 — Criar nova instituição

```gherkin
Cenário: Onboarding de escola
  Dado que estou no painel super admin
  Quando crio instituição "Colégio Beta" com administrador inicial
  Então a instituição existe no banco
  E o administrador pode autenticar e acessar /configuracoes
```

---

## Épico 7 — Jornada do aluno (NOVO)

### HU 7.1 — Listar e realizar prova

**Como** aluno  
**Quero** ver provas disponíveis e enviar respostas  
**Para** concluir avaliações no prazo

```gherkin
Cenário: Submissão dentro do prazo
  Dado avaliação publicada para minha turma
  E prazo_utc ainda não passou
  Quando abro Minhas provas e inicio a avaliação
  E respondo todas as questões obrigatórias
  E envio a submissão
  Então recebo confirmação com status enviada
  E não posso criar segunda submissão para a mesma avaliação
```

```gherkin
Cenário: Aluno não vê rascunho
  Dado avaliação em status rascunho
  Quando consulto GET /aluno/avaliacoes/disponiveis
  Então a avaliação não aparece na lista
```

---

## Rastreabilidade RF ↔ Épico

| Épico | RFs relacionados |
|-------|------------------|
| 1 | RF-001, RF-002, RF-015, RF-016, RF-018, RF-019 |
| 2 | RF-005–RF-009, RF-006, RF-007, RF-008, RF-017 |
| 3 | RF-012–RF-014, RF-023 |
| 4 | RF-003, RF-004, RF-010, RF-011 |
| 5 | RF-020, RF-024 |
| 6 | RF-021 |
| 7 | RF-022 |

---

## Referências

- Requisitos: [05-requisitos-funcionais.md](./05-requisitos-funcionais.md)
- API: [07-api-contrato-backend.md](./07-api-contrato-backend.md)
