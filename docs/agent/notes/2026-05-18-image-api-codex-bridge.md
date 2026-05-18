# Image API Codex bridge

Date: 2026-05-18

## Goal

Integrate image generation into `threepointsweb-pi-core` using Pi's new image-generation API while reusing the Codex CLI flow from `../pi-extension-prisema/scripts/codex-image.mjs`.

## Changes

- Added `extensions/threepointsweb-pi-images.ts`.
- Registers a custom Pi image API provider (`threepointsweb-codex-images`) backed by the Codex image script.
- Exposes `threepointsweb_generate_image` as an LLM-callable tool.
- Adds `/threepointsweb-images` to report backend discovery status.
- Backend script discovery checks environment overrides, an optional packaged script, and the sibling Prisema development script.
- Updated `README.md` and `CHANGELOG.md`.

## Safety notes

- The tool is sequential and warns in prompt guidelines not to invoke image generation unless the user clearly requested it.
- Generated artifact paths are delegated to `scripts/codex-image.mjs`, defaulting to `docs/midia` in the active working directory unless `outputPath` is provided.
- Real image generation was not executed because it may require credentials/cost. Validation used registration checks, missing-backend guard behavior, a fake backend that writes a 1x1 PNG, script help output, and package dry-run inclusion.

## Validation

- Loaded `threepointsweb-pi-images.ts` through `jiti` with a fake Pi API and confirmed registration of:
  - tool: `threepointsweb_generate_image`
  - command: `/threepointsweb-images`
  - event: `session_start`
- Exercised the missing `scriptPath` guard without calling Codex.
- Exercised the successful tool path with a fake backend script that emitted `SAVED_PATH`, `PROMPT_PATH`, `METADATA_PATH`, and a 1x1 PNG; confirmed text + image result content and output path details.
- Ran `node ../pi-extension-prisema/scripts/codex-image.mjs --help`.
- Ran `npm pack --dry-run --json` and confirmed `extensions/threepointsweb-pi-images.ts` is included.
