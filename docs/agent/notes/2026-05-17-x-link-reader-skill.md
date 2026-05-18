# 2026-05-17 — skill x-link-reader

## Objetivo

Migrar a skill `x-link-reader` do pacote de referência para o catálogo sob demanda do ThreePointsWeb, permitindo leitura de posts/perfis públicos do X/Twitter via FxTwitter.

## Contexto

- A referência foi `../pi-extension-prisema/skills/x-link-reader/SKILL.md`.
- A skill é genérica, somente leitura e não depende de credenciais.
- Ela resolve o caso em que `x.com`/`twitter.com` bloqueia fetch direto com páginas anti-bot ou conteúdo vazio.

## Decisões

- Criada `skills-catalog/x-link-reader/SKILL.md`.
- Mantido o nome `x-link-reader`, pois é genérico e descritivo.
- Adaptada a redação para o catálogo ThreePointsWeb, sem branding específico.
- Mantido o uso de `api.fxtwitter.com` como caminho principal.
- Adicionados critérios de quando usar, quando não usar, formato de saída e guardrails.
- Não foi criado subagente, porque a capacidade é uma instrução de fetch/leitura sob demanda, não uma operação autônoma com edição/validação.

## Arquivos alterados

- `skills-catalog/x-link-reader/SKILL.md`
- `docs/agent/notes/2026-05-17-x-link-reader-skill.md`

## Validação

- Frontmatter `name` e `description` conferidos.
- Ausência de branding específico da referência confirmada na skill.
- `npm pack --dry-run --json` confirmou inclusão de `skills-catalog/x-link-reader/SKILL.md`.
- Ausência de skill duplicada pré-existente no catálogo confirmada.

## Riscos

- A skill depende de disponibilidade do serviço público FxTwitter.
- A skill não acessa conteúdo privado/protegido/deletado.
- A skill não deve ser usada para timeline crawling, scraping amplo ou qualquer operação de escrita/interação social.

## Reversão

- Remover `skills-catalog/x-link-reader/SKILL.md` e esta nota.
