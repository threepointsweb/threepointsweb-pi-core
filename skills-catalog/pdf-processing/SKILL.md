---
name: pdf-processing
description: Extract tables from PDF files into Markdown, CSV, or JSON using the bundled pdfplumber helper. Use when the task asks to extract, convert, or summarize tabular data from PDF documents.
---

# PDF Processing

Use this skill when a user asks to extract tables from a PDF or convert PDF tabular content into Markdown/CSV/JSON.

## Tooling

This skill includes a helper script:

```bash
scripts/extract_pdf_tables.py
```

The script uses `pdfplumber`. If the runtime does not already have `pdfplumber`, run the script with `--install-deps`; it creates a cached virtualenv under `~/.cache/threepointsweb-pi-skills/pdf-processing/.venv` and re-runs itself.

## Workflow

1. Resolve the PDF path first. If the user used `@relative/path.pdf`, treat it as relative to the current working directory unless file search proves otherwise.
2. Run the helper against the PDF. Prefer writing output to a project-local file when the table may be large.
3. If dependencies are missing, rerun with `--install-deps` instead of attempting manual PDF parsing.
4. Inspect the extracted table for obvious issues: split rows, missing cells, bad headers, or OCR/image-only failure.
5. Return the table in the format the user asked for. If the user did not specify a format, return Markdown.
6. Mention any extraction caveat briefly, especially if no tables were found or the PDF appears image-only.

## Commands

From this skill directory:

```bash
# Markdown to stdout
python3 scripts/extract_pdf_tables.py --install-deps /absolute/path/file.pdf

# Markdown to a file
python3 scripts/extract_pdf_tables.py --install-deps /absolute/path/file.pdf \
  --output /absolute/path/extracted-table.md

# CSV or JSON
python3 scripts/extract_pdf_tables.py --install-deps /absolute/path/file.pdf --format csv \
  --output /absolute/path/extracted-table.csv
python3 scripts/extract_pdf_tables.py --install-deps /absolute/path/file.pdf --format json

# Specific pages
python3 scripts/extract_pdf_tables.py --install-deps /absolute/path/file.pdf --pages 1,3-5
```

## Helper options

- `--format markdown|csv|json` controls output format. Default: `markdown`.
- `--pages 1,3-5` limits extraction to selected pages.
- `--mode auto|lines|text` controls pdfplumber table strategy. Default: `auto`.
- `--no-merge-fragments` disables automatic merging of adjacent same-width table fragments on the same page.
- `--no-header` makes Markdown output use generic column names instead of treating the first row as a header.

## Fallbacks

- If `auto` finds no table, try `--mode text`.
- If rows are over-merged, retry with `--no-merge-fragments`.
- If the PDF is image-only and no text tables are found, stop and tell the user OCR is required; do not invent table data.

## Done

The requested table is delivered in Markdown/CSV/JSON, with a concise note about extraction quality or limitations.
