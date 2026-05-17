# 2026-05-17 — Initial threepointsweb-pi-core

## Goal

Create public GitHub repository `threepointsweb/threepointsweb-pi-core` and prepare local Pi package skeleton without pushing local files.

## Context

Fabio wants a core ThreePointsWeb extension package for Pi. Repository should be public, under GitHub org `threepointsweb`, but local work should not be pushed until approved.

## Decisions

- Created GitHub repo as public via `gh repo create`.
- Created local repo at `/Users/rizzao/Projetos/MeusProjetos/threepointsweb-pi-core`.
- Added remote `origin` pointing to `https://github.com/threepointsweb/threepointsweb-pi-core.git`.
- Created minimal Pi package manifest in `package.json`.
- Created placeholder extension `extensions/threepointsweb-core.ts` with no runtime behavior.
- Added public-safe `AGENTS.md`, `README.md`, `.gitignore`, and placeholder resource directories.

## Commands run

- `gh repo create threepointsweb/threepointsweb-pi-core --public --description ...`
- `git init -b main`
- `git remote add origin ...`
- File creation commands for package skeleton.

## Files changed

- `AGENTS.md`
- `README.md`
- `.gitignore`
- `package.json`
- `extensions/threepointsweb-core.ts`
- `skills/.gitkeep`
- `prompts/.gitkeep`
- `themes/.gitkeep`
- `docs/agent/notes/2026-05-17-initial-threepointsweb-pi-core.md`

## Tests

- Not run yet beyond file creation.

## Risks

- GitHub repo is public and currently empty remotely.
- Local skeleton is not pushed; remote will not reflect files until Fabio approves push.

## Next

Define first real ThreePointsWeb Pi behavior before pushing.
