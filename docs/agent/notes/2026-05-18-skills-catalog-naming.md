# 2026-05-18 — padronização de nomes do skills-catalog

## Objetivo

Padronizar os nomes das skills em `skills-catalog/` antes do próximo commit, usando nomes em inglês, descritivos e orientados por domínio/ação.

## Regra definida

- Skills do catálogo devem usar nomes em inglês.
- Preferir nomes descritivos e orientados por domínio/ação.
- Padrão preferido: `<domain>-<action>-<object>`.
- Um nome curto equivalente é aceitável quando já for claro.
- O diretório da skill e o frontmatter `name` devem ser iguais.

## Revisão das skills atuais

| Antes | Depois | Decisão |
|---|---|---|
| `pdf-processing` | `pdf-extract-tables` | Renomeada para explicitar ação e objeto. |
| `python-automation` | `python-automation` | Mantida; nome curto e claro para o domínio. |
| `x-link-reader` | `x-read-posts` | Renomeada para padrão domínio/ação e exemplo definido pelo usuário. |
| `pi-extension-design` | `pi-extension-design` | Mantida; nome em inglês, descritivo e claro. |

## Arquivos alterados

- `agents/AGENTS.md`
- `skills-catalog/pdf-extract-tables/SKILL.md`
- `skills-catalog/pdf-extract-tables/scripts/extract_pdf_tables.py`
- `skills-catalog/x-read-posts/SKILL.md`
- `docs/skills-on-demand.md`
- `docs/agent/notes/2026-05-17-skills-on-demand.md`
- `docs/agent/notes/2026-05-17-x-read-posts-skill.md`
- `docs/agent/notes/2026-05-18-skills-catalog-naming.md`

## Testes / validação

- Validação estrutural por script local passou:
  - todo `skills-catalog/*/SKILL.md` tem frontmatter `name` igual ao diretório;
  - não existem diretórios obsoletos do catálogo para os nomes anteriores;
  - referências relevantes foram atualizadas para `pdf-extract-tables` e `x-read-posts`;
  - os únicos nomes anteriores remanescentes aparecem nesta nota como registro explícito da renomeação.
- `python3 skills-catalog/pdf-extract-tables/scripts/extract_pdf_tables.py --help` passou, confirmando que o helper preservado no diretório renomeado continua executável.
- `git diff --check` passou.
- `npm pack --dry-run --json` passou e confirmou inclusão das skills atuais:
  - `skills-catalog/pdf-extract-tables/SKILL.md`;
  - `skills-catalog/pdf-extract-tables/scripts/extract_pdf_tables.py`;
  - `skills-catalog/python-automation/SKILL.md`;
  - `skills-catalog/x-read-posts/SKILL.md`;
  - `skills-catalog/pi-extension-design/SKILL.md`.
- O subagente `Remove Slop` foi executado no escopo rígido desta tarefa e não encontrou slop óbvio; não alterou arquivos.

## Riscos

- Renomear skills recém-publicadas pode exigir atualizar exemplos/documentação e recarregar o pacote local antes de testar.
- O cache de dependências do helper PDF mudou de `pdf-processing` para `pdf-extract-tables`; isso preserva funcionalidade, mas pode recriar o virtualenv na primeira execução após o rename.

## Reversão

- Restaurar os diretórios e frontmatter antigos via git se for necessário manter compatibilidade com nomes já usados em sessões externas.
