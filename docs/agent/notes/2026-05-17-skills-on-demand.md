# 2026-05-17 — skills on demand MVP

## Goal

Research how Pi loads skills and implement an MVP extension/tool flow for `threepointsweb-pi-skills` that searches large skill catalogs without loading every skill into the initial context.

## Research findings

- Pi discovers skills at startup/reload from global, project, package, settings, and CLI paths.
- Pi puts skill metadata (`name`, `description`, `location`) in `<available_skills>` using `formatSkillsForPrompt()`.
- Full `SKILL.md` content is loaded only via `read` or `/skill:name` expansion.
- `disable-model-invocation: true` hides a loaded skill from the prompt, but it remains invokable by command.
- Extensions can add skill paths through `resources_discover`, but only at startup/reload; using that hook for huge visible catalogs would still bloat the prompt.
- No documented/current custom-tool API dynamically adds a skill resource mid-turn, so the MVP uses a compatible fallback: search metadata first, then load exactly one selected skill body through a tool result.

## Implemented artifacts

- `extensions/threepointsweb-pi-skills.ts`
  - `threepointsweb_skill_search`: lazy metadata index + ranked search.
  - `threepointsweb_skill_load`: loads exactly one selected skill into a Pi-style `<skill>` block.
- `docs/skills-on-demand.md`: research, design, usage, limits, and production path.
- `skills-catalog/*/SKILL.md`: bundled on-demand catalog for search → load demonstrations.

## Validation

- TypeScript check with temporary peer-dependency symlinks:
  - `npx --yes --package typescript --package @types/node tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck extensions/threepointsweb-pi-skills.ts extensions/threepointsweb-core.ts`
- Functional fixture check with `tsx` and a fake Pi API:
  - Registered `threepointsweb_skill_search` and `threepointsweb_skill_load`.
  - Search for `extract tables from PDF` finds the PDF table extraction skill in `skills-catalog`.
  - The current catalog name is `pdf-extract-tables`.
- Package check:
  - `npm pack --dry-run` completed and produced `threepointsweb-pi-core-0.1.0.tgz`.
  - `npm pack --dry-run --json` confirmed the new extension, docs, and bundled skills are included.
