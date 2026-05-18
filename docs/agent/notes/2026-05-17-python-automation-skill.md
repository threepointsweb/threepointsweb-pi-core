# 2026-05-17 — skill python-automation

## Objetivo

Migrar a ideia de `prisema-python-script` para uma skill genérica de automação Python no catálogo sob demanda do ThreePointsWeb, sem criar subagente.

## Contexto

- A referência foi `../pi-extension-prisema/skills/prisema-python-script/SKILL.md`.
- A skill original orientava criação de scripts Python robustos para automações com logging, segurança, dry-run e execução reproduzível.
- A avaliação foi que isso é melhor como skill, não subagente, porque orienta o modo de implementar scripts Python em tarefas específicas; não é uma operação autônoma recorrente como `Remove Slop` ou `Code Simplifier`.

## Decisões

- Criada `skills-catalog/python-automation/SKILL.md`.
- Removido branding específico do arquivo de referência.
- Mantida a intenção principal: usar Python quando shell one-liners deixam de ser seguros ou claros.
- Adicionados critérios explícitos de quando usar e quando não usar.
- Reforçadas salvaguardas: validação de inputs, dry-run, proteção de operações destrutivas, logging, ausência de segredos hardcoded e validação em amostra pequena.
- Incluído esqueleto mínimo de script com `argparse`, `pathlib`, `logging` e `--dry-run`.

## Arquivos alterados

- `skills-catalog/python-automation/SKILL.md`
- `docs/agent/notes/2026-05-17-python-automation-skill.md`

## Validação

- Frontmatter `name` e `description` conferidos.
- Ausência de branding específico da referência confirmada na skill.
- `npm pack --dry-run --json` confirmou inclusão de `skills-catalog/python-automation/SKILL.md`.
- `git diff --check` no escopo passou.

## Riscos

- A skill pode incentivar criação de scripts duráveis para tarefas que seriam simples com ferramentas existentes; por isso há uma seção “Do not use when”.
- Scripts reais ainda exigem revisão de riscos de I/O, credenciais, mutações remotas e operações destrutivas caso a caso.

## Reversão

- Remover `skills-catalog/python-automation/SKILL.md` e esta nota.
