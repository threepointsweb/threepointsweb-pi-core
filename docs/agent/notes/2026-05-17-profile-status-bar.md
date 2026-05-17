# Profile status bar

Implemented a ThreePointsWeb core status indicator that shows the detected Pi profile in the footer/status bar.

## Behavior

- On `session_start`, the extension sets status key `threepointsweb-profile` to `profile: <name>`.
- Profile detection prefers explicit env vars, then falls back to `PI_CODING_AGENT_DIR`.
- `pi-profile-` is stripped from profile directory names, so `pi-profile-padrao` appears as `padrao`.
- If no profile env/path is available, it shows `global`.

## Commands

- `/threepointsweb-core` refreshes the status and confirms the core extension is loaded.
- `/threepointsweb-profile` refreshes the status and displays the detected profile.
