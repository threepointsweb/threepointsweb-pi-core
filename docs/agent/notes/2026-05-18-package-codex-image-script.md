# Package Codex image script

Date: 2026-05-18

## Objective

Fix the Git-installed `threepointsweb_generate_image` backend lookup error where the extension expected `scripts/codex-image.mjs` inside the installed `threepointsweb-pi-core` package but the script was not packaged.

## Context

Observed error:

```text
threepointsweb_generate_image
Codex image script not found:
/Users/rizzao/Projetos/MeusProjetos/threepointsweb-pi-profiles/pi-profile-padrao/git/github.com/threepointsweb/threepointsweb-pi-core/scripts/codex-image.mjs. Set THREEPOINTSWEB_CODEX_IMAGE_SCRIPT or pass scriptPath.
```

The extension already searched for a packaged `scripts/codex-image.mjs`; the missing piece was shipping that backend script in this repo.

## Changes

- Added `scripts/codex-image.mjs` to `threepointsweb-pi-core`.
- Script is adapted from the Prisema backend with ThreePointsWeb env var names first:
  - `THREEPOINTSWEB_CODEX_IMAGE_MODEL`
  - `THREEPOINTSWEB_CODEX_IMAGE_OUTPUT_DIR`
- Kept compatibility fallbacks for the original Prisema env vars.
- Updated README wording to make the packaged backend explicit.
- Updated CHANGELOG with the packaging fix.

## Validation

- `node scripts/codex-image.mjs --help`
- `npm pack --dry-run --json` and verify `scripts/codex-image.mjs` is included.

## Risk / rollback

- Risk: duplicated backend script can drift from the Prisema copy.
- Rollback: remove `scripts/codex-image.mjs` and require `THREEPOINTSWEB_CODEX_IMAGE_SCRIPT`/`scriptPath` again.
