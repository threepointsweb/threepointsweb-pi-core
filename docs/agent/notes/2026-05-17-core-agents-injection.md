# 2026-05-17 — threepointsweb-core AGENTS injection

## Request

Fabio observed that `threepointsweb-pi-core` should inject reusable runtime guidance the same way `pi-extension-prisema` injects `agents/AGENTS.md`. The root repository `AGENTS.md` does not affect sessions in other projects such as `vindulautils`.

## Changes

- Added `agents/AGENTS.md` with runtime guidance for ThreePointsWeb Pi sessions.
- Moved the reusable skill-routing rule into `agents/AGENTS.md`:
  - call `threepointsweb_skill_search` before specialized tasks;
  - call `threepointsweb_skill_load` for a strong candidate;
  - do not load many skills speculatively;
  - for PDF/table extraction, search for an applicable skill before manual extraction.
- Updated `extensions/threepointsweb-core.ts` to append `agents/AGENTS.md` to the system prompt in `before_agent_start`, avoiding duplicate insertion when the content is already present.
- Updated root `AGENTS.md` to clarify that reusable runtime guidance belongs in `agents/AGENTS.md`, while root `AGENTS.md` stays focused on repository development rules.
- Updated `README.md` to document the injection behavior.

## Validation

- TypeScript check passed for:
  - `extensions/threepointsweb-core.ts`
  - `extensions/threepointsweb-pi-skills.ts`
  - `extensions/threepointsweb-pi-subagents/index.ts`
- Functional fake-Pi check passed:
  - `threepointsweb-core` registers a `before_agent_start` handler.
  - The handler injects `agents/AGENTS.md` content into the system prompt.
  - The injected prompt contains `threepointsweb_skill_search` guidance.
  - Duplicate injection is skipped when the content is already present.
- Package dry run passed:
  - `npm pack --dry-run --json` includes `agents/AGENTS.md` and `extensions/threepointsweb-core.ts`.
