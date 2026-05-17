# 2026-05-17 — Recognition command

## Goal

Add minimal visible behavior so Fabio can validate that `threepointsweb-pi-core` is recognized by Pi.

## Context

Initial package had an empty placeholder extension. That can load silently, but it is harder to confirm from Pi UI. Fabio asked for a basic extension commit only for recognition validation.

## Decisions

- Added slash command `/threepointsweb-core`.
- Command only sends UI notification: `ThreePointsWeb Pi core loaded.`
- No tools, hooks, external actions, or side effects added.

## Files changed

- `extensions/threepointsweb-core.ts`
- `docs/agent/notes/2026-05-17-recognition-command.md`

## Tests

- `git diff --check`

## Risks

- Command name may conflict only if another extension registers `/threepointsweb-core`; Pi would suffix duplicates.

## Next

Fabio can install/load local package and check command autocomplete or run `/threepointsweb-core`.
