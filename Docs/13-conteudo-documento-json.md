# Conteúdo de documento JSON (provas e questões)

**Versão:** 1.0  
**Uso:** enunciados de questões, instruções gerais da prova, contexto para geração por IA.

## Estrutura raiz

```json
{
  "schema_version": "1.0",
  "blocks": []
}
```

## Tipos de bloco

| `type` | Campos | Descrição |
|--------|--------|-----------|
| `heading` | `level` (1–3), `content` | Título / seção |
| `paragraph` | `content` (string ou spans) | Parágrafo |
| `bulleted_list` | `items[]` | Lista com marcadores |
| `numbered_list` | `items[]` | Lista numerada |
| `quote` | `content` | Citação |
| `callout` | `variant` (info/warning/tip), `content` | Destaque / instrução |
| `divider` | — | Separador visual |
| `image` | `url`, `caption?` | Imagem (URL de upload) |

## Questão (API)

- `conteudo`: objeto `Documento` (JSONB `conteudo_jsonb`)
- `enunciado`: texto plano derivado (busca e fallback)
- Campos estruturados: `tipo`, `alternativas`, `resposta_correta`, `peso`

## Avaliação (API)

- `instrucoes_gerais`: `Documento` (JSONB `instrucoes_jsonb`)
- `payload_editor`: metadados opcionais do editor / IA

## Export Markdown (IA)

O backend expõe `documento_para_markdown()` para serializar blocos em Markdown compatível com prompts de LLM.

## Validação

Pydantic: `backend/app/schemas/documento.py`  
Frontend: `frontend/lib/avaliacoes/documento.ts`
