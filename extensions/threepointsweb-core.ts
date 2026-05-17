import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function threepointswebCore(pi: ExtensionAPI) {
  pi.registerCommand("threepointsweb-core", {
    description: "Confirm ThreePointsWeb Pi core is loaded",
    handler: async (_args, ctx) => {
      ctx.ui.notify("ThreePointsWeb Pi core loaded.", "info");
    },
  });
}
