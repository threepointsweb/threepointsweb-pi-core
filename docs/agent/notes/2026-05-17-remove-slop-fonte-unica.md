# 2026-05-17 — Remove Slop como fonte única

## Objetivo

Melhorar o subagente `Remove Slop` como a fonte única da capacidade de limpeza anti-slop no ThreePointsWeb, sem criar uma skill duplicada em `skills-catalog/`.

## Contexto

- O ThreePointsWeb core já possui um subagente default chamado `Remove Slop` em `extensions/threepointsweb-pi-subagents/default-agents.ts`.
- O pacote de referência tinha uma skill e um prompt `remove-slop`, mas migrá-los diretamente criaria ambiguidade entre skill, prompt e subagente.
- A decisão foi manter a capacidade operacional no subagente, porque ele tem escopo de ferramentas mais seguro: pode editar arquivos existentes, não tem `write`, não deve commitar, deletar, criar branch ou fazer limpeza destrutiva.

## Decisões

- Não foi criado `skills-catalog/remove-slop/SKILL.md`.
- O subagente `Remove Slop` foi tratado como fonte operacional canônica da limpeza anti-slop.
- A configuração do subagente passou a usar `skills: false`, reduzindo a chance de carregar ou seguir uma skill concorrente.
- O prompt do subagente foi reescrito em português e reforçado com uma seção de “Fonte única”.
- `agents/AGENTS.md` foi ajustado para orientar que capacidades já existentes como subagente default devem ser melhoradas no próprio subagente ou na regra que o aciona, não duplicadas como skill/playbook.
- A regra de skills foi alinhada com a extensão `threepointsweb-pi-skills`: o destino padrão para skills/playbooks sob demanda passa a ser `skills-catalog/<skill-name>/SKILL.md`, enquanto `skills/<skill-name>/SKILL.md` fica reservado para skills pequenas, essenciais e estáveis registradas como recurso Pi.

## Arquivos alterados

- `extensions/threepointsweb-pi-subagents/default-agents.ts`
- `agents/AGENTS.md`
- `docs/agent/notes/2026-05-17-remove-slop-fonte-unica.md`

## Comandos executados

- Leitura do subagente `Remove Slop` em `extensions/threepointsweb-pi-subagents/default-agents.ts`.
- Leitura da skill e do prompt `remove-slop` no pacote de referência para entender a capacidade antes de decidir não migrá-la.
- Busca em `skills-catalog/` para confirmar que `remove-slop` não foi criado como skill duplicada.

## Testes / validação

- Validação estrutural por script local passou:
  - `Remove Slop` usa `skills: false`.
  - O prompt do subagente contém a seção “Fonte única”.
  - O prompt reforça que o subagente não tem `write` e nunca deve usar `write`.
  - `agents/AGENTS.md` orienta a não criar skill/playbook `remove-slop` duplicado.
  - `agents/AGENTS.md` orienta a melhorar subagentes default em vez de criar duplicação.
  - `agents/AGENTS.md` registra `skills-catalog/<skill-name>/SKILL.md` como destino padrão para skills/playbooks sob demanda.
  - Não existe `skills-catalog/remove-slop/SKILL.md`.
- `npm pack --dry-run --json` passou e confirmou que `extensions/threepointsweb-pi-subagents/default-agents.ts` e `agents/AGENTS.md` entram no pacote `threepointsweb-pi-core-0.2.0.tgz`.
- `tsc --noEmit` focado em `default-agents.ts` foi tentado, mas não concluiu porque o repositório não tem as peer dependencies `@earendil-works/pi-agent-core` e `@earendil-works/pi-coding-agent` instaladas localmente. A falha foi de resolução de dependências, não dos trechos alterados.
- O subagente `Remove Slop` foi executado no escopo rígido desta tarefa e não encontrou slop claro; ele também rodou `git diff --check` no escopo sem problemas reportados.

## Riscos

- Como o subagente agora não recebe skills, qualquer comportamento complementar de limpeza precisa estar no próprio prompt do subagente ou na orientação que o chama.
- A reescrita em português melhora aderência ao ecossistema local, mas nomes reais de ferramentas e agentes continuam em inglês por serem identificadores.

## Reversão

- Restaurar `skills: true` e o prompt anterior do `Remove Slop` pelo git, caso seja necessário permitir skills dentro desse subagente novamente.
- Remover as novas regras de fonte única em `agents/AGENTS.md` se o projeto decidir voltar a aceitar uma skill `remove-slop` concorrente.

## Próximo passo

- Rodar validação focada e, se passar, considerar a capacidade `Remove Slop` consolidada no subagente default.
