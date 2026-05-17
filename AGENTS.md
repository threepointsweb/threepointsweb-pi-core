# AGENTS.md — threepointsweb-pi-core

## Scope

This repository is the ThreePointsWeb core Pi package.

Fits here:

- Pi extensions, commands, tools, hooks, prompts, skills, and themes for ThreePointsWeb.
- Shared ThreePointsWeb agent behavior intended to be reused across Pi profiles/projects.
- Package metadata and docs for public distribution.

Does not fit here by default:

- Customer/private data.
- One-off scripts unrelated to Pi package behavior.
- Product/app source code not part of the Pi extension package.
- Secrets, auth files, local sessions, or private profile state.

## Rules

- Keep package safe for public repo.
- Do not push until Fabio explicitly approves.
- Prefer minimal, reversible extension behavior.
- For non-trivial work, add a note in `docs/agent/notes/YYYY-MM-DD-<slug>.md`.
- Validate with focused checks before handoff.

## Goal/Sisyphus routing

- Quando a solicitação tiver mais de uma ação concreta, envolver múltiplos arquivos, exigir validação/testes, ou parecer complexa/arriscada, pare antes de executar e ofereça organizar o trabalho como `/goals` ou `/sisyphus`.
- Use `/goals` quando o objetivo final for claro e a ordem dos passos puder ser flexível.
- Use `/sisyphus` quando o usuário trouxer uma sequência numerada/checklist rígido, ou quando a ordem e o critério de conclusão de cada passo precisarem ser preservados.
- Se o usuário aceitar, colete apenas o mínimo faltante e proponha o draft para confirmação; não crie goal/sisyphus sem confirmação explícita.
- Para tarefas simples de uma ação, siga direto, salvo se o usuário pedir `/goals` ou `/sisyphus`.

## Runtime context injection

- Reusable runtime guidance that should affect projects outside this repository belongs in `agents/AGENTS.md` and is injected by `extensions/threepointsweb-core.ts`.
- Keep this root `AGENTS.md` focused on repository development rules.
