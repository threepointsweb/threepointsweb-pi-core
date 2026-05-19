# threepointsweb-pi-core

ThreePointsWeb core extension package for [Pi](https://pi.dev/).

Status: core package with ThreePointsWeb utility extensions.

Included extensions:

- `threepointsweb-core` — confirms the package is loaded, shows the detected Pi profile, and injects reusable runtime guidance from `agents/AGENTS.md`.
- `threepointsweb-pi-skills` — MVP tools for searching large skill catalogs on demand and loading exactly one selected skill into context.
- `threepointsweb-pi-subagents` — subagent orchestration tools (`Agent`, `get_subagent_result`, `steer_subagent`) migrated into this shared core package.
- `threepointsweb-pi-images` — image generation bridge using Pi's image-generation API with the Codex CLI backend from `scripts/codex-image.mjs`.

## Local install while developing

```bash
pi install /Users/rizzao/Projetos/MeusProjetos/threepointsweb-pi-core
```

Or add to a profile/settings file:

```json
{
  "packages": ["/Users/rizzao/Projetos/MeusProjetos/threepointsweb-pi-core"]
}
```

## Runtime guidance injection

The `threepointsweb-core` extension appends `agents/AGENTS.md` to the system prompt during `before_agent_start` when this package is loaded. This is where reusable behavior such as skill routing belongs, because the repository root `AGENTS.md` only applies when working inside this repo.

## Subagents extension

The `threepointsweb-pi-subagents` extension now lives in this repo under `extensions/threepointsweb-pi-subagents/`.

It registers the subagent tools:

- `Agent`
- `get_subagent_result`
- `steer_subagent`

If the standalone package `threepointsweb-pi-subagents` is still installed in the same Pi profile/project, remove or disable one copy to avoid duplicate tool/command registration.

## Image generation bridge

The `threepointsweb-pi-images` extension registers:

- `threepointsweb_generate_image` — generates an image or rewrites an image prompt through Pi's image-generation API, backed by the Codex CLI script.
- `/threepointsweb-images` — reports whether the backend script was found.

Backend script discovery checks `THREEPOINTSWEB_CODEX_IMAGE_SCRIPT`, `PI_EXTENSION_PRISEMA_CODEX_IMAGE_SCRIPT`, the packaged `scripts/codex-image.mjs`, and the sibling development path `../pi-extension-prisema/scripts/codex-image.mjs`. By default, the backend script saves generated artifacts under `docs/midia` relative to the active working directory unless `outputPath` is provided.

The tool may invoke Codex and therefore can involve external credentials or cost; use it only after the user has clearly requested image generation.

## Skills on demand MVP

The `threepointsweb-pi-skills` extension exposes two tools:

- `threepointsweb_skill_search` — searches skill metadata by task/intention without loading all skill bodies.
- `threepointsweb_skill_load` — loads exactly one selected skill as a Pi-compatible `<skill>` block.

Optional catalog paths can be configured with `THREEPOINTSWEB_PI_SKILLS_PATHS` or passed per tool call with `catalogPaths`. This package also ships a local `skills-catalog/`. See `docs/skills-on-demand.md` for the research, usage examples, and current MVP limits.

## Package structure

- `agents/AGENTS.md` — reusable runtime guidance injected by the core extension.
- `extensions/threepointsweb-core.ts` — core extension entrypoint.
- `extensions/threepointsweb-pi-skills.ts` — on-demand skill search/load MVP.
- `extensions/threepointsweb-pi-subagents/` — migrated subagents extension source.
- `extensions/threepointsweb-pi-images.ts` — Pi image-generation API bridge to the Codex CLI backend.
- `skills-catalog/` — bundled on-demand skills, including a working PDF table extraction skill.
- `skills/` — future ThreePointsWeb skills.
- `prompts/` — future prompt templates.
- `themes/` — future themes.
- `docs/skills-on-demand.md` — design and usage notes for the skills MVP.
- `docs/agent/notes/` — task notes from agent work.

## Publish/push status

Repository exists on GitHub, but local work should not be pushed until Fabio approves.
