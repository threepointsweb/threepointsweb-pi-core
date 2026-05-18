# 2026-05-18 — design gate em goals/sisyphus

## Objetivo

Integrar o comportamento de brainstorming/design gate ao roteamento de `/goals` e `/sisyphus`, removendo o `Plan` como caminho recomendado para trabalho ambíguo no ThreePointsWeb.

## Contexto

- A referência analisada foi `../pi-extension-prisema/skills/prisema-brainstorming/SKILL.md`.
- A skill de referência orientava transformar pedidos ambíguos em design aprovado antes de implementar, com contexto, perguntas bloqueantes, opções, trade-offs, recomendação, plano, validação e aprovação.
- A decisão do projeto foi não criar uma skill `brainstorming`/`design-gate` e não depender do subagente `Plan` como caminho principal.
- `/goals` e `/sisyphus` já coletam objetivo, critérios, limites, restrições e regra de bloqueio; por isso são o lugar natural para o design gate.

## Decisões

- `agents/AGENTS.md` agora define `/goals` e `/sisyphus` como portão de design para pedidos complexos, ambíguos, criativos, de arquitetura, UX, conteúdo, mídia, comportamento ou múltiplas frentes.
- A discussão de goal/sisyphus deve fazer apenas pesquisa leve/somente leitura quando necessário, perguntar no máximo 1–2 bloqueadores, oferecer opções com trade-offs quando houver escolha real, recomendar um caminho e explicitar validação/reversão antes do draft.
- A fase de goal/sisyphus não deve implementar antes da confirmação.
- `/goals` continua sendo o caminho para objetivo flexível; `/sisyphus` continua sendo o caminho para sequência/checklist rígido.
- Não foi criada skill/playbook `brainstorming` ou `design-gate`.
- `Plan` foi removido do roteamento recomendado em `agents/AGENTS.md` e da orientação do tool `Agent`.
- `Plan` foi removido de `DEFAULT_AGENT_NAMES` e marcado como legado/desabilitado (`enabled: false`) em `default-agents.ts`, sem remover o bloco inteiro para evitar refactor amplo.
- `getDefaultAgentNames()` agora filtra agentes desabilitados para que defaults legados não apareçam na lista principal.

## Arquivos alterados

- `agents/AGENTS.md`
- `extensions/threepointsweb-pi-subagents/index.ts`
- `extensions/threepointsweb-pi-subagents/types.ts`
- `extensions/threepointsweb-pi-subagents/default-agents.ts`
- `extensions/threepointsweb-pi-subagents/agent-types.ts`
- `docs/agent/notes/2026-05-18-goals-sisyphus-design-gate.md`

## Testes / validação

- Validação estrutural por script local passou:
  - `agents/AGENTS.md` contém o design gate em `/goals`/`/sisyphus`.
  - `agents/AGENTS.md` cobre pedidos complexos, ambíguos, criativos, de arquitetura, UX, conteúdo, mídia, comportamento e múltiplas frentes.
  - `agents/AGENTS.md` orienta pesquisa leve/somente leitura, 1–2 perguntas bloqueantes, opções com trade-offs, recomendação, validação e reversão antes do draft.
  - `agents/AGENTS.md` proíbe implementação durante o portão e preserva confirmação explícita antes de criar goal/sisyphus.
  - `agents/AGENTS.md` mantém `/goals` para objetivo flexível e `/sisyphus` para sequência/checklist rígido.
  - `agents/AGENTS.md` não recomenda `Plan` e proíbe skill/playbook `brainstorming` ou `design-gate` duplicado.
  - `extensions/threepointsweb-pi-subagents/index.ts` não recomenda mais `Plan` e orienta `/goals`/`/sisyphus` como design/approval gate.
  - `Plan` saiu de `DEFAULT_AGENT_NAMES`.
  - `Plan` está `enabled: false` e descrito como legado em `default-agents.ts`.
  - `getDefaultAgentNames()` filtra agentes desabilitados.
  - Não existe `skills-catalog/design-gate/SKILL.md` nem `skills-catalog/brainstorming/SKILL.md`.
- `git diff --check` no escopo passou.
- `npm pack --dry-run --json` passou e confirmou inclusão de `agents/AGENTS.md`, `index.ts`, `types.ts`, `default-agents.ts` e `agent-types.ts` no pacote.
- `tsc --noEmit` focado foi tentado, mas não concluiu porque o repositório não tem as peer dependencies locais necessárias (`@earendil-works/pi-ai`, `@earendil-works/pi-coding-agent` e tipos Node configurados para este check isolado). A falha foi de ambiente/resolução de dependências, não de validação semântica dos trechos alterados.
- O subagente `Remove Slop` foi executado no escopo rígido desta tarefa e não encontrou slop óbvio; ele também rodou `git diff --check` no escopo sem erros.

## Riscos

- O bloco legado de `Plan` ainda existe desabilitado para evitar refactor amplo; se alguém invocar explicitamente `Plan`, a validação de tipo deve tratá-lo como desabilitado.
- Se no futuro Taskdone voltar a ser caminho principal, o `Plan` pode ser reabilitado com ajustes.

## Reversão

- Recolocar `Plan` em `DEFAULT_AGENT_NAMES`.
- Remover `enabled: false` de `Plan`.
- Restaurar a recomendação de `Plan` em `agents/AGENTS.md` e `extensions/threepointsweb-pi-subagents/index.ts`.
- Remover as novas regras de design gate em `/goals`/`/sisyphus` se o fluxo voltar a depender de skill/subagente específico.
