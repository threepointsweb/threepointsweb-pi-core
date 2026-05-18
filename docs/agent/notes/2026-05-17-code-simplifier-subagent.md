# 2026-05-17 — subagente Code Simplifier

## Objetivo

Criar o subagente default `Code Simplifier` e ajustar o loop ThreePointsWeb para chamá-lo antes do `Remove Slop` quando houver complexidade real no código alterado.

## Contexto

- A referência analisada foi `../pi-extension-prisema/skills/prisema-code-simplifier/SKILL.md`.
- A skill de referência define uma limpeza/refino de código com regra principal de preservar comportamento, focando em aninhamento, abstrações redundantes, duplicação, nomes pouco claros, fluxo fraco e inconsistência local.
- A decisão foi não migrar como skill para `skills-catalog/`, porque a capacidade é operacional: precisa ler diff/escopo, editar arquivos existentes e validar quando editar.
- O novo subagente complementa o `Remove Slop`: simplifica código quando há complexidade real; depois o `Remove Slop` faz a limpeza final anti-slop.

## Decisões

- Adicionado o subagente default `Code Simplifier` em `extensions/threepointsweb-pi-subagents/default-agents.ts`.
- Registrado `Code Simplifier` em `DEFAULT_AGENT_NAMES` em `extensions/threepointsweb-pi-subagents/types.ts`.
- Atualizada a orientação da ferramenta `Agent` em `extensions/threepointsweb-pi-subagents/index.ts` para listar quando usar `Code Simplifier` e a ordem antes do `Remove Slop`.
- Ajustado `agents/AGENTS.md` para descrever:
  - quando chamar `Code Simplifier`;
  - quando não chamar;
  - o contrato de instrução para o subagente;
  - o loop: `Implement` → validação focada → `Code Simplifier` quando necessário → validação novamente → `Remove Slop` → handoff.
- Não foi criado `skills-catalog/prisema-code-simplifier/SKILL.md` nem `skills-catalog/code-simplifier/SKILL.md`.

## Guardrails do novo subagente

- Edita somente arquivos existentes com `edit`.
- Não tem `write`.
- Não cria arquivos.
- Não commita, stageia, faz push, cria/troca branch, reescreve histórico, deleta arquivos ou executa limpeza destrutiva.
- Atua somente em escopo tocado/fornecido.
- Preserva comportamento, outputs, contratos, side effects, APIs públicas, segurança, autenticação, persistência, produção, acessibilidade e padrões locais.
- Não atua em documentação simples, configuração trivial, mudança de uma linha clara, código já legível, ou quando a validação básica ainda falha por causa não entendida.

## Arquivos alterados

- `extensions/threepointsweb-pi-subagents/default-agents.ts`
- `extensions/threepointsweb-pi-subagents/types.ts`
- `extensions/threepointsweb-pi-subagents/index.ts`
- `agents/AGENTS.md`
- `docs/agent/notes/2026-05-17-code-simplifier-subagent.md`

## Testes / validação

- Validação estrutural por script local passou:
  - `Code Simplifier` aparece em `DEFAULT_AGENTS`.
  - `Code Simplifier` aparece em `DEFAULT_AGENT_NAMES`.
  - A orientação da ferramenta `Agent` lista `Code Simplifier` antes de `Remove Slop`.
  - O subagente usa `skills: false`.
  - O prompt reforça ausência de `write`, proíbe criação de arquivos e proíbe mutações de git.
  - O prompt preserva comportamento, outputs, contratos, side effects, APIs públicas e padrões locais.
  - O prompt limita atuação ao escopo tocado/fornecido e exige validação útil quando editar.
  - `agents/AGENTS.md` coloca `Code Simplifier` antes do `Remove Slop` e descreve quando chamar/não chamar.
  - Não existe skill duplicada em `skills-catalog/code-simplifier/SKILL.md` nem `skills-catalog/prisema-code-simplifier/SKILL.md`.
- `git diff --check` no escopo passou.
- `npm pack --dry-run --json` passou e confirmou inclusão de `extensions/threepointsweb-pi-subagents/default-agents.ts`, `extensions/threepointsweb-pi-subagents/types.ts`, `extensions/threepointsweb-pi-subagents/index.ts` e `agents/AGENTS.md` no pacote `threepointsweb-pi-core-0.2.0.tgz`.
- `tsc --noEmit` focado foi tentado, mas não concluiu porque o repositório não tem as peer dependencies locais necessárias (`@earendil-works/pi-ai`, `@earendil-works/pi-coding-agent` e tipos Node configurados para este check isolado). A falha foi de ambiente/resolução de dependências, não de validação semântica dos trechos alterados.
- O subagente `Remove Slop` foi executado no escopo rígido desta tarefa; ele ajustou apenas uma redação pontual no prompt (`stale` → `obsoleto`) e rodou `git diff --check` no escopo sem erros.

## Riscos

- Se chamado em tarefas triviais, o subagente pode virar custo/latência desnecessária; por isso o loop exige sinais de complexidade real.
- Se o escopo dado for amplo demais, o subagente deve não editar nada e pedir escopo menor.
- Como `skills: false`, melhorias futuras da capacidade devem ser feitas no prompt do subagente ou na regra de roteamento, não em skill concorrente.

## Reversão

- Remover o bloco `Code Simplifier` de `DEFAULT_AGENTS`.
- Remover `Code Simplifier` de `DEFAULT_AGENT_NAMES`.
- Reverter as menções em `extensions/threepointsweb-pi-subagents/index.ts` e `agents/AGENTS.md`.
