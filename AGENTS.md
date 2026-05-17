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
