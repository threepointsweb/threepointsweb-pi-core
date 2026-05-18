# 2026-05-17 — real PDF table skill and skills-catalog

## Request

Fabio asked to remove the `examples/` wrapper, keep only `skills-catalog/`, and make the PDF skill operational for real testing.

## Changes

- Moved `examples/skills-catalog/` to root-level `skills-catalog/` and removed the empty `examples/` directory.
- Updated references in `README.md`, `docs/skills-on-demand.md`, and the earlier skills-on-demand agent note.
- Updated `extensions/threepointsweb-pi-skills.ts` so the default catalog search includes this package's `skills-catalog/` directory.
- Replaced the placeholder PDF fixture with an operational skill now named `pdf-extract-tables`:
  - `skills-catalog/pdf-extract-tables/SKILL.md`
  - `skills-catalog/pdf-extract-tables/scripts/extract_pdf_tables.py`
- The helper extracts PDF tables through `pdfplumber`, supports Markdown/CSV/JSON, selected pages, strategy modes, and automatic cached dependency setup with `--install-deps`.

## Validation

- TypeScript check passed for the core, skills, and subagents extensions.
- Functional fake-Pi check from a different cwd (`vindulautils`) found the PDF extraction skill through the default `skills-catalog/` path and loaded instructions containing `scripts/extract_pdf_tables.py`.
- Real PDF extraction check passed against:
  - `/Users/rizzao/Projetos/MeusProjetos/vindulautils/docs/relatorios/vindula-cosmos-resumo-1p-tv-corporativa.pdf`
- Extracted Markdown contained the expected header and rows:
  - `Funcionalidade | O que entrega`
  - `Grupos por local`
  - `Vídeos e painéis`
  - `Player em modo TV`
- `npm pack --dry-run --json` confirmed `skills-catalog/` and the helper script are included, and no `examples/` files are included.

## Caveat

The helper depends on `pdfplumber`. Use `--install-deps` to create a cached virtualenv automatically when the runtime does not already provide it. Image-only PDFs still require OCR and should not be hallucinated.
