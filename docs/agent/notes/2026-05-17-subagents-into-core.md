# 2026-05-17 — migrate threepointsweb-pi-subagents into core

## Request

Fabio asked whether `threepointsweb-pi-subagents` could live inside `threepointsweb-pi-core`, then approved doing it.

## Decision

Yes. The subagents extension fits the repo scope because it is reusable Pi extension behavior for the ThreePointsWeb package suite.

## Changes

- Copied the standalone subagents extension source from:
  - `/Users/rizzao/Projetos/MeusProjetos/threepointsweb-pi-subagents/src/`
- New in-core location:
  - `extensions/threepointsweb-pi-subagents/`
- Excluded test files from the runtime extension directory.
- Updated imports from the old package namespace:
  - `@mariozechner/*` → `@earendil-works/*`
  - `@sinclair/typebox` → `typebox`
- Added local attribution/license file:
  - `extensions/threepointsweb-pi-subagents/LICENSE`
- Updated root `README.md` to mention the migrated subagents extension and duplicate-install caveat.
- Updated root `package.json` peer dependencies for `pi-agent-core`, `pi-ai`, `pi-tui`, `pi-coding-agent`, and `typebox`.

## Caveat

If the standalone `threepointsweb-pi-subagents` package remains installed in the same Pi profile/project as this core package, Pi may see duplicate tools/commands. Disable or remove one copy for normal use.

## Validation

- TypeScript check passed with temporary peer-dependency symlinks:
  - `tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck extensions/threepointsweb-core.ts extensions/threepointsweb-pi-skills.ts extensions/threepointsweb-pi-subagents/index.ts`
- Functional fake-Pi registration check passed:
  - Registered tools: `Agent`, `get_subagent_result`, `steer_subagent`.
  - Registered command: `/agents`.
  - Registered renderer: `subagent-notification`.
  - Registered lifecycle handlers for session/tool events.
- Package dry run passed:
  - `npm pack --dry-run --json` includes the migrated subagents source, README, and license.
  - No test files are included in the package tarball.
