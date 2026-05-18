---
name: python-automation
description: Create robust Python automation with logging, safety checks, dry-run support, and reproducible execution. Use when a task needs structured data processing, API calls, file transformations, reports, scraping cleanup, or error handling beyond simple shell commands.
---

# Python Automation

Use this skill when Python is the safest and clearest tool for automation.

Prefer Python over shell one-liners when the task has structured inputs/outputs, multi-step logic, external APIs, retries, parsing, transformations, or meaningful failure handling.

## Use when

- transforming structured data such as JSON, CSV, XML, Markdown, logs, or API responses
- calling authenticated or paginated APIs
- migrating, normalizing, renaming, or reorganizing files
- generating reports or derived artifacts
- scraping or extracting content that needs cleanup logic
- coordinating multi-step automation with retries, resumability, or error handling
- replacing fragile shell pipelines that are becoming hard to read or unsafe to rerun

## Do not use when

- a simple read-only shell command is clearer and safe
- the task only needs a one-off grep/find/count already covered by available tools
- the script would hide a risky side effect that should be explicit
- the user has not approved destructive writes, remote mutations, publishing, or costly API calls
- the automation would require hardcoded secrets or private credentials

## Workflow

1. **Confirm the job shape**
   - inputs and how they are discovered
   - expected outputs and output paths
   - constraints and assumptions
   - side effects and rollback path
   - whether dry-run is required before real writes

2. **Choose the right location**
   - reusable repository script: `scripts/` or the project’s established helper directory
   - task-local helper: a clearly named project path that can be removed later
   - temporary exploration: prefer not to create a durable file unless the user asked or reuse is likely

3. **Make safety the default**
   - validate arguments and input paths early
   - fail fast with actionable error messages
   - protect destructive operations with `--dry-run`, confirmation flags, backups, or explicit output directories
   - write intermediates to temporary files/directories when appropriate
   - avoid modifying source data in place unless explicitly approved

4. **Add useful logging**
   Log enough for another operator to understand what happened:
   - start/end time
   - parsed parameters
   - input and output paths
   - file/network operations
   - counts of processed/skipped/failed items
   - warnings and recoverable failures
   - fatal errors with context and next action

5. **Validate on the smallest useful sample**
   - run against a representative subset before broad execution
   - verify the output shape and important edge cases
   - run the project’s lint/type/test command when it exists and is relevant
   - compare before/after counts or checksums when data integrity matters

## Implementation rules

Prefer:

- Python standard library first
- `argparse` for command-line interfaces
- `pathlib.Path` for paths
- `logging` over scattered `print`
- small functions with typed signatures when useful
- deterministic output paths and filenames
- explicit error handling around file, network, auth, and parsing boundaries
- idempotent or resumable behavior when the script may be rerun

Avoid:

- hidden side effects at import time
- broad `except Exception` blocks that swallow failures
- destructive writes without dry-run, backup, or explicit approval path
- hardcoded secrets, tokens, user data, or environment-specific paths
- mixing unrelated responsibilities in one script
- clever parsing when a clear library or explicit schema is safer

## Minimal script shape

```python
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import logging
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Describe what this automation does.")
    parser.add_argument("input", type=Path, help="Input file or directory")
    parser.add_argument("--output", type=Path, required=True, help="Output path")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without writing")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    if not args.input.exists():
        raise SystemExit(f"Input not found: {args.input}")

    logging.info("Starting automation: input=%s output=%s dry_run=%s", args.input, args.output, args.dry_run)

    if args.dry_run:
        logging.info("Dry run complete; no files written")
        return 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    # Perform the safe write here.
    logging.info("Done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

## Quality checklist

Before finishing, verify:

- Is Python actually the simplest safe tool for this job?
- Can the script be rerun predictably?
- Are risky operations visible and guarded?
- Are inputs, outputs, and side effects clear?
- Are failures actionable instead of silent?
- Would another operator understand how to use it tomorrow?

## Final response

Report:

1. script path and purpose
2. how to run it safely, including dry-run if available
3. validation performed and result
4. risks, required credentials, or approval still needed
