# 2026-05-17 — skill x-read-posts

## Objetivo

Migrar a skill de leitura de links do X/Twitter do pacote de referência para o catálogo sob demanda do ThreePointsWeb, permitindo leitura de posts/perfis públicos via FxTwitter.

## Contexto

- A referência foi a skill de leitura de X/Twitter do pacote anterior.
- A skill é genérica, somente leitura e não depende de credenciais.
- Ela resolve o caso em que `x.com`/`twitter.com` bloqueia fetch direto com páginas anti-bot ou conteúdo vazio.
- A skill foi renomeada para `x-read-posts` para seguir o padrão de nomes em inglês orientados por domínio/ação.

## Decisões

- Criada a skill de catálogo `skills-catalog/x-read-posts/SKILL.md`.
- O frontmatter usa `name: x-read-posts`.
- Adaptada a redação para o catálogo ThreePointsWeb, sem branding específico.
- Mantido o uso de `api.fxtwitter.com` como caminho principal.
- Adicionados critérios de quando usar, quando não usar, formato de saída e guardrails.
- Não foi criado subagente, porque a capacidade é uma instrução de fetch/leitura sob demanda, não uma operação autônoma com edição/validação.

## Arquivos alterados

- `skills-catalog/x-read-posts/SKILL.md`
- `docs/agent/notes/2026-05-17-x-read-posts-skill.md`

## Validação

- Frontmatter `name` e `description` conferidos.
- Ausência de branding específico da referência confirmada na skill.
- `npm pack --dry-run --json` confirmou inclusão da skill no pacote.
- Ausência de skill duplicada pré-existente no catálogo confirmada.

## Riscos

- A skill depende de disponibilidade do serviço público FxTwitter.
- A skill não acessa conteúdo privado/protegido/deletado.
- A skill não deve ser usada para timeline crawling, scraping amplo ou qualquer operação de escrita/interação social.

## Reversão

- Remover `skills-catalog/x-read-posts/SKILL.md` e esta nota.
