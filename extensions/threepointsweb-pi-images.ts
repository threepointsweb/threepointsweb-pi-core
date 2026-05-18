import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
  AssistantImages,
  ImageContent,
  ImagesContext,
  ImagesModel,
  ImagesOptions,
  ImagesOutputContent,
} from "@earendil-works/pi-ai";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Type } from "typebox";

const TOOL_NAME = "threepointsweb_generate_image";
const STATUS_KEY = "threepointsweb-images";
const CODEX_IMAGES_API = "threepointsweb-codex-images";
const CODEX_IMAGES_PROVIDER = "threepointsweb-codex";
const DEFAULT_CODEX_MODEL = process.env.THREEPOINTSWEB_CODEX_IMAGE_MODEL || "gpt-5.5";
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_INLINE_IMAGE_BASE64_BYTES = 4.5 * 1024 * 1024;

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const requireFromExtension = createRequire(import.meta.url);

type PiAiRuntime = {
  generateImages: typeof import("@earendil-works/pi-ai").generateImages;
  registerImagesApiProvider: typeof import("@earendil-works/pi-ai").registerImagesApiProvider;
};

function nodePathDirs(): string[] {
  return (process.env.NODE_PATH ?? "")
    .split(process.platform === "win32" ? ";" : ":")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parentDirs(startPath: string | undefined, maxDepth = 8): string[] {
  if (!startPath) return [];

  const dirs: string[] = [];
  let current = dirname(resolve(startPath));
  for (let depth = 0; depth < maxDepth; depth += 1) {
    dirs.push(current);
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return dirs;
}

function piAiRuntimeCandidates(): string[] {
  const fromNodePath = nodePathDirs().flatMap((directory) => [
    join(directory, "@earendil-works", "pi-ai", "dist", "index.js"),
    join(directory, "@earendil-works", "pi-coding-agent", "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
  ]);
  const fromRequirePaths = (requireFromExtension.resolve.paths("@earendil-works/pi-ai") ?? []).map((directory) =>
    join(directory, "@earendil-works", "pi-ai", "dist", "index.js"),
  );
  const fromPiCliPath = parentDirs(process.argv[1]).flatMap((directory) => [
    join(directory, "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
    join(directory, "node_modules", "@earendil-works", "pi-coding-agent", "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
    join(directory, "@earendil-works", "pi-ai", "dist", "index.js"),
    join(directory, "@earendil-works", "pi-coding-agent", "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
  ]);

  return [
    process.env.THREEPOINTSWEB_PI_AI_DIST,
    join(PACKAGE_ROOT, "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
    join(PACKAGE_ROOT, "node_modules", "@earendil-works", "pi-coding-agent", "node_modules", "@earendil-works", "pi-ai", "dist", "index.js"),
    ...fromRequirePaths,
    ...fromNodePath,
    ...fromPiCliPath,
  ].filter((candidate): candidate is string => Boolean(candidate));
}

async function loadPiAiRuntime(): Promise<PiAiRuntime> {
  for (const candidate of piAiRuntimeCandidates()) {
    const resolved = resolvePath(candidate, PACKAGE_ROOT);
    if (!existsSync(resolved)) continue;
    return import(resolved) as Promise<PiAiRuntime>;
  }

  throw new Error("Could not locate @earendil-works/pi-ai/dist/index.js for Pi image-generation API registration.");
}

interface CodexImageOptions extends ImagesOptions {
  cwd?: string;
  outputPath?: string;
  referencePaths?: string[];
  aspectRatio?: string;
  style?: string;
  model?: string;
  rewriteOnly?: boolean;
  rawPrompt?: boolean;
  replace?: boolean;
  open?: boolean;
  scriptPath?: string;
  timeoutMs?: number;
}

type CodexImageToolParams = Omit<CodexImageOptions, "cwd" | "signal"> & {
  prompt: string;
};

interface ParsedCodexOutput {
  savedPath?: string;
  promptPath?: string;
  metadataPath?: string;
  stdout: string;
  stderr: string;
}

interface CodexImageDetails {
  api: string;
  provider: string;
  model: string;
  outputPath?: string;
  promptPath?: string;
  metadataPath?: string;
  scriptPath: string;
  cwd: string;
  references: string[];
  rewriteOnly: boolean;
  inlineImageIncluded: boolean;
  inlineImageOmittedReason?: string;
  stdout: string;
  stderr: string;
}

function expandHomePath(filePath: string): string {
  if (filePath === "~") return homedir();
  if (filePath.startsWith("~/")) return join(homedir(), filePath.slice(2));
  return filePath;
}

function resolvePath(filePath: string, cwd: string): string {
  const expanded = expandHomePath(filePath);
  return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
}

function defaultScriptCandidates(): string[] {
  return [
    process.env.THREEPOINTSWEB_CODEX_IMAGE_SCRIPT,
    process.env.PI_EXTENSION_PRISEMA_CODEX_IMAGE_SCRIPT,
    join(PACKAGE_ROOT, "scripts", "codex-image.mjs"),
    join(dirname(PACKAGE_ROOT), "pi-extension-prisema", "scripts", "codex-image.mjs"),
  ].filter((candidate): candidate is string => Boolean(candidate));
}

function resolveCodexImageScript(cwd: string, scriptPath?: string): string {
  if (scriptPath) return resolvePath(scriptPath, cwd);

  for (const candidate of defaultScriptCandidates()) {
    const resolved = resolvePath(candidate, cwd);
    if (existsSync(resolved)) return resolved;
  }

  return resolvePath(defaultScriptCandidates()[0] ?? "../pi-extension-prisema/scripts/codex-image.mjs", cwd);
}

function textFromImagesContext(context: ImagesContext): string {
  return context.input
    .filter((item) => item.type === "text")
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".png";
}

function detectImageMimeType(buffer: Buffer, filePath: string): string {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";

  const ext = extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}

function parseCodexOutput(stdout: string, stderr: string): ParsedCodexOutput {
  const readMarker = (marker: string): string | undefined => {
    const match = stdout.match(new RegExp(`^${marker}:\\s*(.+)$`, "m"));
    return match?.[1]?.trim();
  };

  return {
    savedPath: readMarker("SAVED_PATH"),
    promptPath: readMarker("PROMPT_PATH"),
    metadataPath: readMarker("METADATA_PATH"),
    stdout,
    stderr,
  };
}

function createImagesError(model: ImagesModel<typeof CODEX_IMAGES_API>, message: string): AssistantImages {
  return {
    api: model.api,
    provider: model.provider,
    model: model.id,
    output: [{ type: "text", text: message }],
    stopReason: "error",
    errorMessage: message,
    timestamp: Date.now(),
  };
}

async function writeContextImagesToTempFiles(context: ImagesContext, tempDir: string): Promise<string[]> {
  const imagePaths: string[] = [];
  const images = context.input.filter((item): item is ImageContent => item.type === "image");

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const filePath = join(tempDir, `reference-${index + 1}${extensionForMimeType(image.mimeType)}`);
    await writeFile(filePath, Buffer.from(image.data, "base64"));
    imagePaths.push(filePath);
  }

  return imagePaths;
}

export default async function threepointswebPiImages(pi: ExtensionAPI) {
  let runtime: PiAiRuntime | undefined;
  let runtimeError = "";
  try {
    runtime = await loadPiAiRuntime();
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error);
  }

  const codexImageModel: ImagesModel<typeof CODEX_IMAGES_API> = {
    id: DEFAULT_CODEX_MODEL,
    name: `Codex CLI Image (${DEFAULT_CODEX_MODEL})`,
    api: CODEX_IMAGES_API,
    provider: CODEX_IMAGES_PROVIDER,
    baseUrl: "local:codex-cli",
    input: ["text", "image"],
    output: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  };

  if (runtime) runtime.registerImagesApiProvider({
    api: CODEX_IMAGES_API,
    async generateImages(model, context, options?: CodexImageOptions): Promise<AssistantImages> {
      const cwd = options?.cwd ?? process.cwd();
      const scriptPath = resolveCodexImageScript(cwd, options?.scriptPath);
      if (!existsSync(scriptPath)) {
        return createImagesError(
          model,
          `Codex image script not found: ${scriptPath}. Set THREEPOINTSWEB_CODEX_IMAGE_SCRIPT or pass scriptPath.`,
        );
      }

      const prompt = textFromImagesContext(context);
      if (!prompt) return createImagesError(model, "Image generation requires text prompt input.");

      const tempDir = await mkdtemp(join(tmpdir(), "threepointsweb-codex-images-"));
      try {
        const contextReferencePaths = await writeContextImagesToTempFiles(context, tempDir);
        const configuredReferencePaths = (options?.referencePaths ?? []).map((filePath) => resolvePath(filePath, cwd));
        const referencePaths = [...configuredReferencePaths, ...contextReferencePaths];

        const args = [scriptPath];
        const effectiveModel = options?.model ?? model.id;
        if (options?.outputPath) args.push("--out", options.outputPath);
        if (effectiveModel) args.push("--model", effectiveModel);
        if (options?.aspectRatio) args.push("--aspect", options.aspectRatio);
        if (options?.style) args.push("--style", options.style);
        for (const referencePath of referencePaths) args.push("--ref", referencePath);
        if (options?.rewriteOnly) args.push("--rewrite-only");
        if (options?.rawPrompt) args.push("--raw-prompt");
        if (options?.replace) args.push("--replace");
        if (options?.open) args.push("--open");
        args.push(prompt);

        const result = await pi.exec("node", args, {
          cwd,
          signal: options?.signal,
          timeout: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        });
        const parsed = parseCodexOutput(result.stdout, result.stderr);

        if (result.code !== 0) {
          return createImagesError(
            model,
            `Codex image script failed with exit code ${result.code}.${result.stderr ? `\n${result.stderr}` : ""}`,
          );
        }

        const output: ImagesOutputContent[] = [{ type: "text", text: result.stdout.trim() || "Codex image script completed." }];
        if (!options?.rewriteOnly) {
          const outputPath = parsed.savedPath ? resolvePath(parsed.savedPath, cwd) : undefined;
          if (!outputPath || !existsSync(outputPath)) {
            return createImagesError(model, `Codex image script completed but no generated image was found at ${outputPath ?? "SAVED_PATH"}.`);
          }

          const imageBuffer = await readFile(outputPath);
          const imageBase64 = imageBuffer.toString("base64");
          if (Buffer.byteLength(imageBase64, "utf8") <= MAX_INLINE_IMAGE_BASE64_BYTES) {
            output.push({ type: "image" as const, data: imageBase64, mimeType: detectImageMimeType(imageBuffer, outputPath) });
          } else {
            output.push({
              type: "text" as const,
              text: `[Image generated at ${outputPath}; inline image omitted because it exceeds ${Math.round(MAX_INLINE_IMAGE_BASE64_BYTES / 1024 / 1024)}MB base64.]`,
            });
          }
        }

        return {
          api: model.api,
          provider: model.provider,
          model: effectiveModel,
          output,
          stopReason: "stop",
          timestamp: Date.now(),
        };
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  }, "threepointsweb-pi-core");

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, "images: codex");
  });

  pi.registerTool({
    name: TOOL_NAME,
    label: "Generate Image",
    description:
      "Generate or rewrite an image prompt through Pi's image-generation API backed by the Codex CLI script. Returns generated image content when small enough plus saved artifact paths. May use external credentials/cost through Codex.",
    promptSnippet: "Generate images through the ThreePointsWeb Codex image bridge when the user explicitly asks for image creation.",
    promptGuidelines: [
      `Use ${TOOL_NAME} only when the user explicitly asks to create or rewrite an image prompt.`,
      `Before using ${TOOL_NAME}, avoid surprise cost or external calls when the user has not clearly authorized image generation.`,
      `${TOOL_NAME} saves artifacts in the current project by default via the Codex image script, unless outputPath is provided.`,
    ],
    executionMode: "sequential",
    parameters: Type.Object({
      prompt: Type.String({ description: "Image request to generate or rewrite." }),
      outputPath: Type.Optional(Type.String({ description: "Optional output image path. Relative paths resolve from the current working directory. Default is docs/midia from the backend script." })),
      referencePaths: Type.Optional(Type.Array(Type.String({ description: "Optional reference image paths to pass to Codex." }))),
      aspectRatio: Type.Optional(Type.String({ description: "Optional aspect ratio, e.g. 16:9, 1:1, 9:16." })),
      style: Type.Optional(Type.String({ description: "Optional style preset or short style hint." })),
      model: Type.Optional(Type.String({ description: `Codex model to use. Defaults to ${DEFAULT_CODEX_MODEL}.` })),
      rewriteOnly: Type.Optional(Type.Boolean({ description: "Only rewrite/enhance the image prompt; do not generate an image." })),
      rawPrompt: Type.Optional(Type.Boolean({ description: "Skip prompt enhancement in the backend script." })),
      replace: Type.Optional(Type.Boolean({ description: "Allow replacing existing output/prompt/metadata files." })),
      open: Type.Optional(Type.Boolean({ description: "Open the generated image on macOS after generation." })),
      scriptPath: Type.Optional(Type.String({ description: "Override path to scripts/codex-image.mjs." })),
      timeoutMs: Type.Optional(Type.Number({ description: "Execution timeout in milliseconds. Default is 10 minutes." })),
    }),
    async execute(_toolCallId, params: CodexImageToolParams, signal, onUpdate, ctx) {
      const scriptPath = resolveCodexImageScript(ctx.cwd, params.scriptPath);
      onUpdate?.({
        content: [{ type: "text", text: `Starting Codex image generation via ${basename(scriptPath)}...` }],
        details: { scriptPath, cwd: ctx.cwd } as Partial<CodexImageDetails>,
      });

      if (!runtime) {
        throw new Error(`Pi image-generation API unavailable: ${runtimeError}`);
      }

      const result = await runtime.generateImages(codexImageModel, { input: [{ type: "text", text: params.prompt }] }, {
        signal,
        cwd: ctx.cwd,
        outputPath: params.outputPath,
        referencePaths: params.referencePaths,
        aspectRatio: params.aspectRatio,
        style: params.style,
        model: params.model,
        rewriteOnly: params.rewriteOnly,
        rawPrompt: params.rawPrompt,
        replace: params.replace,
        open: params.open,
        scriptPath: params.scriptPath,
        timeoutMs: params.timeoutMs,
      } as CodexImageOptions);

      if (result.stopReason === "error") {
        throw new Error(result.errorMessage ?? "Codex image generation failed.");
      }

      const textOutput = result.output
        .filter((item): item is Extract<ImagesOutputContent, { type: "text" }> => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      const parsed = parseCodexOutput(textOutput, "");
      const outputPath = parsed.savedPath ? resolvePath(parsed.savedPath, ctx.cwd) : undefined;
      const inlineImageIncluded = result.output.some((item) => item.type === "image");

      return {
        content: result.output,
        details: {
          api: result.api,
          provider: result.provider,
          model: result.model,
          outputPath,
          promptPath: parsed.promptPath ? resolvePath(parsed.promptPath, ctx.cwd) : undefined,
          metadataPath: parsed.metadataPath ? resolvePath(parsed.metadataPath, ctx.cwd) : undefined,
          scriptPath,
          cwd: ctx.cwd,
          references: params.referencePaths ?? [],
          rewriteOnly: Boolean(params.rewriteOnly),
          inlineImageIncluded,
          inlineImageOmittedReason: outputPath && !inlineImageIncluded && !params.rewriteOnly ? "Image artifact saved on disk but omitted from inline result due size or backend output." : undefined,
          stdout: textOutput,
          stderr: "",
        } satisfies CodexImageDetails,
      };
    },
  });

  pi.registerCommand("threepointsweb-images", {
    description: "Show ThreePointsWeb image generation backend status",
    handler: async (_args, ctx) => {
      const scriptPath = resolveCodexImageScript(ctx.cwd);
      const scriptExists = existsSync(scriptPath);
      const message = !runtime
        ? `ThreePointsWeb image API bridge loaded, but Pi image API runtime was not found: ${runtimeError}`
        : scriptExists
          ? `ThreePointsWeb image API bridge loaded. Backend: ${scriptPath}`
          : `ThreePointsWeb image API bridge loaded, but backend script was not found. Set THREEPOINTSWEB_CODEX_IMAGE_SCRIPT. Tried: ${scriptPath}`;

      ctx.ui.setStatus(STATUS_KEY, "images: codex");
      ctx.ui.notify(message, runtime && scriptExists ? "info" : "warning");
    },
  });
}
