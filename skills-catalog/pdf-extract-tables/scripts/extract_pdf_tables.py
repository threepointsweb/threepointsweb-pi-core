#!/usr/bin/env python3
"""Extract tables from PDF files using pdfplumber.

This helper is intentionally self-contained for Pi skill usage:
- It can create a small cached virtualenv with pdfplumber via --install-deps.
- It extracts tables to Markdown, CSV, or JSON.
- It merges adjacent same-width table fragments on the same page by default, which
  helps with visually single tables that pdfplumber splits into row fragments.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import subprocess
import sys
import venv
from pathlib import Path
from typing import Any, Iterable

DEFAULT_VENV = Path.home() / ".cache" / "threepointsweb-pi-skills" / "pdf-extract-tables" / ".venv"


def venv_python(venv_dir: Path) -> Path:
    return venv_dir / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def running_inside(venv_dir: Path) -> bool:
    try:
        return Path(sys.executable).resolve() == venv_python(venv_dir).resolve()
    except OSError:
        return False


def ensure_deps(venv_dir: Path) -> None:
    py = venv_python(venv_dir)
    if not py.exists():
        print(f"Creating dependency venv: {venv_dir}", file=sys.stderr)
        venv.EnvBuilder(with_pip=True, clear=False).create(venv_dir)
    print("Installing/updating pdfplumber...", file=sys.stderr)
    subprocess.run([str(py), "-m", "pip", "install", "--upgrade", "pip", "pdfplumber"], check=True)


def maybe_reexec_with_venv(args: list[str], venv_dir: Path, install_deps: bool) -> None:
    if running_inside(venv_dir):
        return

    py = venv_python(venv_dir)
    if install_deps:
        ensure_deps(venv_dir)
        cleaned = [arg for arg in args if arg != "--install-deps"]
        os.execv(str(py), [str(py), __file__, *cleaned])

    if py.exists():
        os.execv(str(py), [str(py), __file__, *args])


def import_pdfplumber() -> Any:
    try:
        import pdfplumber  # type: ignore

        return pdfplumber
    except ModuleNotFoundError as exc:
        print(
            "Missing dependency: pdfplumber.\n"
            "Run again with --install-deps to create a cached venv automatically, e.g.:\n"
            f"  python3 {__file__} --install-deps <file.pdf>",
            file=sys.stderr,
        )
        raise SystemExit(2) from exc


def parse_pages(value: str | None, total_pages: int) -> list[int]:
    if not value:
        return list(range(1, total_pages + 1))

    pages: set[int] = set()
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_raw, end_raw = part.split("-", 1)
            start = int(start_raw)
            end = int(end_raw)
            pages.update(range(start, end + 1))
        else:
            pages.add(int(part))

    invalid = [page for page in pages if page < 1 or page > total_pages]
    if invalid:
        raise ValueError(f"Invalid page(s) for {total_pages}-page PDF: {invalid}")
    return sorted(pages)


def clean_cell(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).replace("\r", "\n").split())


def clean_table(table: Iterable[Iterable[Any]]) -> list[list[str]]:
    rows = [[clean_cell(cell) for cell in row] for row in table]
    rows = [row for row in rows if any(cell for cell in row)]
    if not rows:
        return []
    width = max(len(row) for row in rows)
    return [row + [""] * (width - len(row)) for row in rows]


def merge_same_width_tables(tables: list[list[list[str]]]) -> list[list[list[str]]]:
    merged: list[list[list[str]]] = []
    for table in tables:
        if not table:
            continue
        width = max(len(row) for row in table)
        if merged:
            previous_width = max(len(row) for row in merged[-1])
            if previous_width == width:
                merged[-1].extend(table)
                continue
        merged.append([row[:] for row in table])
    return merged


def markdown_escape(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", "<br>")


def table_to_markdown(rows: list[list[str]], first_row_header: bool) -> str:
    if not rows:
        return ""
    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]

    if first_row_header:
        header = normalized[0]
        body = normalized[1:]
    else:
        header = [f"Column {index + 1}" for index in range(width)]
        body = normalized

    lines = [
        "| " + " | ".join(markdown_escape(cell) for cell in header) + " |",
        "| " + " | ".join("---" for _ in header) + " |",
    ]
    for row in body:
        lines.append("| " + " | ".join(markdown_escape(cell) for cell in row) + " |")
    return "\n".join(lines)


def table_settings_for(mode: str) -> list[dict[str, Any] | None]:
    if mode == "lines":
        return [None]
    if mode == "text":
        return [{"vertical_strategy": "text", "horizontal_strategy": "text"}]
    return [None, {"vertical_strategy": "text", "horizontal_strategy": "text"}]


def extract(pdf_path: Path, pages_arg: str | None, mode: str, merge_fragments: bool) -> list[dict[str, Any]]:
    pdfplumber = import_pdfplumber()
    results: list[dict[str, Any]] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        selected_pages = parse_pages(pages_arg, len(pdf.pages))
        for page_number in selected_pages:
            page = pdf.pages[page_number - 1]
            extracted: list[list[list[str]]] = []
            used_mode = mode
            for settings in table_settings_for(mode):
                raw_tables = page.extract_tables(table_settings=settings) if settings else page.extract_tables()
                tables = [clean_table(table) for table in raw_tables]
                tables = [table for table in tables if table]
                if tables:
                    extracted = tables
                    used_mode = "text" if settings else "lines/default"
                    break

            if merge_fragments:
                extracted = merge_same_width_tables(extracted)

            for table_index, table in enumerate(extracted, 1):
                results.append({
                    "page": page_number,
                    "table": table_index,
                    "mode": used_mode,
                    "rows": table,
                })
    return results


def write_markdown(results: list[dict[str, Any]], first_row_header: bool) -> str:
    if not results:
        return "No tables found."
    chunks: list[str] = []
    for item in results:
        chunks.append(f"## Page {item['page']} — Table {item['table']} ({item['mode']})")
        chunks.append(table_to_markdown(item["rows"], first_row_header=first_row_header))
    return "\n\n".join(chunks).rstrip() + "\n"


def write_csv_text(results: list[dict[str, Any]]) -> str:
    import io

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["page", "table", "row", "column", "value"])
    for item in results:
        for row_index, row in enumerate(item["rows"], 1):
            for col_index, value in enumerate(row, 1):
                writer.writerow([item["page"], item["table"], row_index, col_index, value])
    return output.getvalue()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Extract PDF tables to Markdown, CSV, or JSON.")
    parser.add_argument("pdf", help="PDF file path")
    parser.add_argument("--output", "-o", help="Output file path. Defaults to stdout.")
    parser.add_argument("--format", choices=["markdown", "csv", "json"], default="markdown")
    parser.add_argument("--pages", help="Pages to process, e.g. 1 or 1,3-5. Defaults to all pages.")
    parser.add_argument("--mode", choices=["auto", "lines", "text"], default="auto", help="pdfplumber table strategy.")
    parser.add_argument("--no-merge-fragments", action="store_true", help="Do not merge adjacent same-width table fragments on the same page.")
    parser.add_argument("--no-header", action="store_true", help="For Markdown, do not treat the first row as a header.")
    parser.add_argument("--install-deps", action="store_true", help="Create/use a cached venv and install pdfplumber before running.")
    parser.add_argument("--venv", default=str(DEFAULT_VENV), help="Dependency venv path for --install-deps.")
    return parser


def main(argv: list[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    venv_dir = Path(args.venv).expanduser().resolve()
    maybe_reexec_with_venv(argv, venv_dir, args.install_deps)

    pdf_path = Path(args.pdf).expanduser().resolve()
    if not pdf_path.exists():
        parser.error(f"PDF not found: {pdf_path}")

    results = extract(
        pdf_path,
        pages_arg=args.pages,
        mode=args.mode,
        merge_fragments=not args.no_merge_fragments,
    )

    if args.format == "json":
        text = json.dumps({"pdf": str(pdf_path), "tables": results}, ensure_ascii=False, indent=2) + "\n"
    elif args.format == "csv":
        text = write_csv_text(results)
    else:
        text = write_markdown(results, first_row_header=not args.no_header)

    if args.output:
        out_path = Path(args.output).expanduser().resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(text, encoding="utf-8")
        print(f"Wrote {len(results)} table(s) to {out_path}", file=sys.stderr)
    else:
        sys.stdout.write(text)

    return 0 if results else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
