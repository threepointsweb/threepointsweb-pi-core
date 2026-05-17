import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROFILE_STATUS_KEY = "threepointsweb-profile";
const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const AGENTS_CONTEXT_PATH = join(PACKAGE_ROOT, "agents", "AGENTS.md");

function normalizeProfileName(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;

  const name = basename(raw).replace(/^pi-profile-/, "");
  return name || raw;
}

function detectProfileName(): string {
  return (
    normalizeProfileName(process.env.PI_PROFILE_NAME) ??
    normalizeProfileName(process.env.PI_PROFILE) ??
    normalizeProfileName(process.env.PI_CODING_AGENT_PROFILE) ??
    normalizeProfileName(process.env.PI_AGENT_PROFILE) ??
    normalizeProfileName(process.env.PI_CODING_AGENT_DIR) ??
    "global"
  );
}

function loadAgentsContext(): string {
  if (!existsSync(AGENTS_CONTEXT_PATH)) return "";
  return readFileSync(AGENTS_CONTEXT_PATH, "utf8").trim();
}

export default function threepointswebCore(pi: ExtensionAPI) {
  const profileName = detectProfileName();

  function updateProfileStatus(ctx: { ui: { setStatus: (key: string, value: string | undefined) => void } }) {
    ctx.ui.setStatus(PROFILE_STATUS_KEY, `profile: ${profileName}`);
  }

  pi.on("before_agent_start", async (event) => {
    const agentsContext = loadAgentsContext();
    if (!agentsContext || event.systemPrompt.includes(agentsContext)) return;

    return {
      systemPrompt: `${event.systemPrompt}\n\n${agentsContext}`,
    };
  });

  pi.on("session_start", async (_event, ctx) => {
    updateProfileStatus(ctx);
  });

  pi.registerCommand("threepointsweb-core", {
    description: "Confirm ThreePointsWeb Pi core is loaded",
    handler: async (_args, ctx) => {
      updateProfileStatus(ctx);
      ctx.ui.notify(`ThreePointsWeb Pi core loaded. Profile: ${profileName}.`, "info");
    },
  });

  pi.registerCommand("threepointsweb-profile", {
    description: "Show the active Pi profile detected by ThreePointsWeb core",
    handler: async (_args, ctx) => {
      updateProfileStatus(ctx);
      ctx.ui.notify(`Active Pi profile: ${profileName}`, "info");
    },
  });
}
