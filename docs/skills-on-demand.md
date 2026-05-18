# ThreePointsWeb skills on demand MVP

This document records the research and design for `threepointsweb-pi-skills`, an MVP extension/tool flow that searches large skill catalogs without placing every skill in the initial Pi context.

## Evidence: how Pi currently loads skills

Based on the Pi docs and installed runtime code:

- Skill discovery happens from global, project, package, settings, and CLI paths. Package resources can be declared under `package.json` `pi.skills`, or discovered from a conventional `skills/` directory.
- `loadSkills()` scans skill paths and builds metadata objects containing `name`, `description`, `filePath`, `baseDir`, `sourceInfo`, and `disableModelInvocation`.
- `formatSkillsForPrompt()` emits the `<available_skills>` XML section in the system prompt. It includes only name, description, and location, not the full body.
- Skills with `disable-model-invocation: true` are excluded from `<available_skills>`, but can still be invoked explicitly with `/skill:name` if they are loaded as Pi resources.
- Full skill content is loaded only when the agent reads the `SKILL.md` file or when `/skill:name` expands the command into a `<skill>` block.
- Extensions can contribute skill paths during `resources_discover`, but that hook runs on startup/reload and then Pi rebuilds the system prompt. Adding a large catalog there still creates a huge available-skills listing unless every skill is hidden from model invocation.
- There is no public custom-tool API in the current docs/runtime that adds a new skill resource and rebuilds the prompt mid-turn. Runtime dynamic registration exists for tools, not for skills. The compatible fallback is to load exactly one selected `SKILL.md` into the tool result.

Relevant docs/code checked:

- Pi docs: `docs/skills.md`, `docs/extensions.md`, `docs/packages.md`.
- Pi runtime: `dist/core/skills.js`, `dist/core/resource-loader.js`, `dist/core/system-prompt.js`, and `dist/core/agent-session.js`.

## MVP architecture

The extension in `extensions/threepointsweb-pi-skills.ts` registers two tools:

1. `threepointsweb_skill_search`
   - Input: a task/intention query.
   - Builds a lazy in-memory metadata index from configured skill catalog paths.
   - Searches `name`, `description`, and path with lightweight token scoring.
   - Returns concise candidates and exact load instructions.
   - Does not return full skill bodies.

2. `threepointsweb_skill_load`
   - Input: selected skill `path`, exact `name`, or fallback `query`.
   - Loads exactly one indexed skill.
   - Returns a Pi-compatible `<skill>` block with the skill body and base directory for relative references.
   - Truncates using Pi's default output limits and points to the file for remaining content.

This flow keeps the initial prompt small:

```text
user task → threepointsweb_skill_search(query)
          → choose candidate
          → threepointsweb_skill_load(path/name)
          → follow only that skill's instructions
```

## Catalog configuration

By default, the tool indexes metadata from existing local skill locations when they exist:

- `~/.pi/agent/skills`
- `~/.agents/skills`
- `.pi/skills` and `.agents/skills` in the current project/ancestors up to the git root
- this package's `skills-catalog/` directory
- this package's `skills/` directory

Additional catalog roots can be supplied with either environment variable:

```bash
export THREEPOINTSWEB_PI_SKILLS_PATHS="/path/to/catalog-a:/path/to/catalog-b"
export THREEPOINTSWEB_SKILLS_PATHS="/path/to/catalog-c"
```

A tool call can also pass `catalogPaths` for one-off catalogs, for example the bundled catalog:

```json
{
  "query": "build a pi extension tool",
  "catalogPaths": ["skills-catalog"]
}
```

## Example flow

1. Search:

```json
threepointsweb_skill_search({
  "query": "extract tables from PDF",
  "catalogPaths": ["skills-catalog"]
})
```

2. Load the selected candidate:

```json
threepointsweb_skill_load({
  "name": "pdf-extract-tables",
  "catalogPaths": ["skills-catalog"]
})
```

3. Follow the returned `<skill>` block. Relative references are resolved from the reported skill directory.

## Limits and production path

This is an MVP, not the final answer for hundreds of thousands of real skills:

- The index is in-memory and rebuilt lazily on first search or when `refresh` is true.
- Search is lightweight token scoring, not embeddings or FTS.
- The extension intentionally avoids `resources_discover` for large catalogs because that would reintroduce prompt bloat.
- If a catalog is already loaded by Pi as hidden skills (`disable-model-invocation: true`), search results can note that `/skill:name` is available.

Recommended production evolution:

1. Persist metadata in a local SQLite/FTS index.
2. Add a separate indexing command for very large catalogs.
3. Store summaries/tags/aliases per skill to improve recall.
4. Optionally integrate embeddings or a service-backed search backend.
5. Keep the load step explicit: only one chosen skill body enters context.
