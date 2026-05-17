# Changelog

## 0.2.0 — 2026-05-17

### Added

- Inject reusable ThreePointsWeb runtime guidance from `agents/AGENTS.md` via `threepointsweb-core`.
- Add on-demand skill discovery tools:
  - `threepointsweb_skill_search`
  - `threepointsweb_skill_load`
- Add bundled `skills-catalog/` with an operational PDF table extraction skill.
- Add `threepointsweb-pi-subagents` extension source to this core package.
- Add documentation for skills-on-demand architecture, usage, limitations, and validation notes.

### Changed

- Root `AGENTS.md` now stays focused on repository-development rules; reusable runtime behavior lives in `agents/AGENTS.md`.
- Package peer dependencies now include Pi runtime packages used by the bundled extensions.

### Validation

- TypeScript checks passed for core, skills, and subagents extensions.
- Functional fake-Pi checks passed for runtime guidance injection, skill search/load, and subagent tool registration.
- Real PDF table extraction was validated against the Vindula TV Corporativa PDF fixture in Fabio's local workspace.
- `npm pack --dry-run --json` confirmed release artifacts are included.
