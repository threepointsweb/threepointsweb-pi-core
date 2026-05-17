# threepointsweb-pi-subagents

Subagent orchestration extension migrated into `threepointsweb-pi-core`.

Original standalone package path during migration:

`/Users/rizzao/Projetos/MeusProjetos/threepointsweb-pi-subagents`

This directory keeps the extension source under an `index.ts` entrypoint so Pi can discover it from the parent package's `./extensions` manifest entry.

Registered tools:

- `Agent`
- `get_subagent_result`
- `steer_subagent`

Do not enable both this migrated copy and the standalone `threepointsweb-pi-subagents` package in the same Pi runtime unless duplicate tool registration is intentionally being tested.
