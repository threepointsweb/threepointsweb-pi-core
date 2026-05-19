#!/usr/bin/env node
// Usage:
//   node scripts/codex-image.mjs [--out path] [--ref image] [--open] [--rewrite-only] [--style cinematic] <prompt>
//
// Shell fallback used by the ThreePointsWeb Pi image bridge. It drives Codex CLI's
// built-in image generation path and saves the resulting artifact at a predictable path.

import { spawnSync } from "node:child_process";
import { accessSync, constants as fsConstants, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

const usage = "Usage: codex-image [--out path] [--ref image] [--open] [--rewrite-only] [--style cinematic] <prompt>";
const defaultModel = process.env.THREEPOINTSWEB_CODEX_IMAGE_MODEL || process.env.PI_EXTENSION_PRISEMA_CODEX_IMAGE_MODEL || "gpt-5.5";
const defaultOutputDir = process.env.THREEPOINTSWEB_CODEX_IMAGE_OUTPUT_DIR || process.env.PI_EXTENSION_PRISEMA_CODEX_IMAGE_OUTPUT_DIR || "docs/midia";

function expandHomePath(filePath) {
  if (filePath === "~") return homedir();
  if (filePath.startsWith("~/")) return join(homedir(), filePath.slice(2));
  return filePath;
}

function resolveConfiguredPath(filePath, baseDir) {
  const expandedPath = expandHomePath(filePath);
  return isAbsolute(expandedPath) ? expandedPath : resolve(baseDir, expandedPath);
}

function isPathInside(childPath, parentPath) {
  const relativePath = relative(parentPath, childPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

function slugifyFilename(value) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "image";
}

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function ensureImageExtension(filePath) {
  return extname(filePath) ? filePath : `${filePath}.png`;
}

function replaceFileExtension(filePath, suffix) {
  const extension = extname(filePath);
  return extension ? `${filePath.slice(0, -extension.length)}${suffix}` : `${filePath}${suffix}`;
}

function buildDefaultOutputPath(cwd, prompt) {
  const outputDir = resolveConfiguredPath(defaultOutputDir, cwd);
  return join(outputDir, `codex-image-${timestampForFilename()}-${slugifyFilename(prompt)}.png`);
}

function parseArgs(argv, cwd) {
  const parsed = {
    aspectRatio: "",
    enhancePrompt: true,
    fullAuto: true,
    metadataPath: "",
    model: defaultModel,
    open: false,
    outputPath: "",
    promptPath: "",
    referencePaths: [],
    replace: false,
    rewriteOnly: false,
    style: "",
  };
  const promptTokens = [];
  const tokens = [...argv];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const readValue = (flagName) => {
      const value = tokens[index + 1];
      if (!value) return { error: `Missing value for ${flagName}. ${usage}` };
      index += 1;
      return { value };
    };

    if (token === "--help" || token === "-h") return { help: true };
    if (token === "--out" || token === "-o") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.outputPath = result.value;
      continue;
    }
    if (token.startsWith("--out=")) {
      parsed.outputPath = token.slice("--out=".length);
      continue;
    }
    if (token === "--model" || token === "-m") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.model = result.value;
      continue;
    }
    if (token.startsWith("--model=")) {
      parsed.model = token.slice("--model=".length);
      continue;
    }
    if (token === "--aspect" || token === "--aspect-ratio" || token === "--ar") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.aspectRatio = result.value;
      continue;
    }
    if (token.startsWith("--aspect=") || token.startsWith("--aspect-ratio=") || token.startsWith("--ar=")) {
      parsed.aspectRatio = token.slice(token.indexOf("=") + 1);
      continue;
    }
    if (token === "--style") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.style = result.value;
      continue;
    }
    if (token.startsWith("--style=")) {
      parsed.style = token.slice("--style=".length);
      continue;
    }
    if (token === "--ref" || token === "--reference" || token === "-i") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.referencePaths.push(result.value);
      continue;
    }
    if (token.startsWith("--ref=") || token.startsWith("--reference=")) {
      parsed.referencePaths.push(token.slice(token.indexOf("=") + 1));
      continue;
    }
    if (token === "--prompt-out") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.promptPath = result.value;
      continue;
    }
    if (token.startsWith("--prompt-out=")) {
      parsed.promptPath = token.slice("--prompt-out=".length);
      continue;
    }
    if (token === "--metadata-out") {
      const result = readValue(token);
      if (result.error) return result;
      parsed.metadataPath = result.value;
      continue;
    }
    if (token.startsWith("--metadata-out=")) {
      parsed.metadataPath = token.slice("--metadata-out=".length);
      continue;
    }
    if (token === "--open") {
      parsed.open = true;
      continue;
    }
    if (token === "--rewrite-only" || token === "--enhance-only" || token === "--prompt-only") {
      parsed.rewriteOnly = true;
      continue;
    }
    if (token === "--raw-prompt" || token === "--no-rewrite" || token === "--no-enhance") {
      parsed.enhancePrompt = false;
      continue;
    }
    if (token === "--replace") {
      parsed.replace = true;
      continue;
    }
    if (token === "--no-full-auto") {
      parsed.fullAuto = false;
      continue;
    }
    if (token.startsWith("--")) return { error: `Unknown option: ${token}. ${usage}` };
    promptTokens.push(token);
  }

  const prompt = promptTokens.join(" ").trim();
  if (!prompt) return { error: usage };

  const outputPath = parsed.outputPath
    ? ensureImageExtension(resolveConfiguredPath(parsed.outputPath, cwd))
    : buildDefaultOutputPath(cwd, prompt);
  const promptPath = parsed.promptPath
    ? resolveConfiguredPath(parsed.promptPath, cwd)
    : replaceFileExtension(outputPath, ".prompt.md");
  const metadataPath = parsed.metadataPath
    ? resolveConfiguredPath(parsed.metadataPath, cwd)
    : replaceFileExtension(outputPath, ".metadata.json");

  return {
    ...parsed,
    metadataPath,
    outputPath,
    prompt,
    promptPath,
    referencePaths: parsed.referencePaths.map((filePath) => resolveConfiguredPath(filePath, cwd)),
  };
}

function findCommandOnPath(commandName) {
  const separator = process.platform === "win32" ? ";" : ":";
  for (const directory of (process.env.PATH || "").split(separator).filter(Boolean)) {
    const candidate = join(directory, commandName);
    try {
      accessSync(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // keep scanning
    }
  }
  return null;
}

function validateOptions(options) {
  for (const referencePath of options.referencePaths) {
    if (!existsSync(referencePath)) return `Reference image not found: ${referencePath}`;
  }
  if (!options.rewriteOnly && existsSync(options.outputPath) && !options.replace) {
    return `Output already exists: ${options.outputPath}. Use --replace or choose another --out.`;
  }
  if (options.rewriteOnly && existsSync(options.promptPath) && !options.replace) {
    return `Prompt already exists: ${options.promptPath}. Use --replace or choose another --prompt-out.`;
  }
  return "";
}

function formatReferenceLines(referencePaths) {
  if (!referencePaths.length) return [];
  return [
    "Reference images attached via -i:",
    ...referencePaths.map((filePath, index) => `- Image ${index + 1}: ${filePath}`),
    "Use reference images for visual identity, logo shape, colors, composition, or style as implied by the user request. Do not add unrelated marks.",
  ];
}

function buildRewriteInstructions(options) {
  if (!options.enhancePrompt) {
    return [
      "Prompt mode: raw.",
      "Use the user's image request as the image prompt, adding only required execution details such as save path and aspect ratio.",
    ];
  }

  return [
    "Prompt mode: enhanced.",
    "Before calling image generation, rewrite the user's request into a production-ready image prompt.",
    "Preserve the user's intent, subject, constraints, brand/logo requirements, and exact requested mood.",
    "Add only useful visual detail: use case, subject, style/medium, composition/framing, lighting, palette, textures, constraints, and avoid list.",
    "Do not add unrelated characters, objects, text, brands, or story elements.",
    `Save the final enhanced prompt exactly at: ${options.promptPath}`,
  ];
}

function buildImagePrompt(options) {
  return [
    "Use $imagegen to generate one high-quality raster image through Codex's built-in image generation path.",
    "Do not create SVG, HTML, or placeholder art unless the user explicitly requested it.",
    options.aspectRatio ? `Aspect ratio: ${options.aspectRatio}` : "",
    options.style ? `Style preset: ${options.style}` : "",
    ...formatReferenceLines(options.referencePaths),
    "",
    ...buildRewriteInstructions(options),
    "",
    "User image request:",
    options.prompt,
    "",
    "After generation:",
    `1. Create parent directories and save/copy the final selected PNG exactly at: ${options.outputPath}`,
    `2. Save JSON metadata at: ${options.metadataPath}`,
    "3. Metadata must include originalPrompt, enhancedPrompt, model, aspectRatio, style, references, outputPath, and generatedAt.",
    "4. Verify that the PNG file exists at the exact output path.",
    "5. Final response must contain only this single line:",
    `SAVED_PATH: ${options.outputPath}`,
  ].filter(Boolean).join("\n");
}

function buildPromptRewritePrompt(options) {
  return [
    "Rewrite the user's image request into a production-ready prompt for high-quality AI image generation.",
    "Do not generate an image.",
    "Preserve the user's intent, subject, constraints, brand/logo requirements, and exact requested mood.",
    "Add only useful visual detail: use case, subject, style/medium, composition/framing, lighting, palette, textures, constraints, and avoid list.",
    "Do not add unrelated characters, objects, text, brands, or story elements.",
    "Return the improved prompt in Portuguese or English matching the user's wording, whichever is clearer for image generation.",
    options.aspectRatio ? `Aspect ratio to include: ${options.aspectRatio}` : "",
    options.style ? `Style preset to apply: ${options.style}` : "",
    ...formatReferenceLines(options.referencePaths),
    "",
    "User image request:",
    options.prompt,
    "",
    `Save the improved prompt exactly at: ${options.promptPath}`,
    `Save JSON metadata at: ${options.metadataPath}`,
    "Final response: only the improved prompt text, no preamble.",
  ].filter(Boolean).join("\n");
}

function addWritableDirArgs(codexArgs, cwd, filePaths) {
  const directories = [...new Set(filePaths.map((filePath) => dirname(filePath)))];
  for (const directory of directories) {
    if (!isPathInside(directory, cwd)) codexArgs.push("--add-dir", directory);
  }
}

function writeFallbackMetadata(options, enhancedPrompt = "") {
  const metadata = {
    originalPrompt: options.prompt,
    enhancedPrompt,
    model: options.model,
    aspectRatio: options.aspectRatio,
    style: options.style,
    references: options.referencePaths,
    outputPath: options.outputPath,
    promptPath: options.promptPath,
    metadataPath: options.metadataPath,
    generatedAt: new Date().toISOString(),
    runner: "threepointsweb-pi-core/scripts/codex-image.mjs",
  };
  mkdirSync(dirname(options.metadataPath), { recursive: true });
  writeFileSync(options.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

function runCodex(options, cwd) {
  const codexCommand = findCommandOnPath("codex");
  if (!codexCommand) {
    console.error("Codex CLI not found on PATH. Install/activate `codex` before using codex-image.");
    return 127;
  }

  const tempDir = mkdtempSync(join(tmpdir(), "threepointsweb-codex-image-cli-"));
  const lastMessagePath = join(tempDir, "last-message.txt");
  const codexArgs = ["exec", "-m", options.model, "-C", cwd, "--skip-git-repo-check", "-o", lastMessagePath];
  if (options.fullAuto) codexArgs.push("--full-auto");
  for (const referencePath of options.referencePaths) codexArgs.push("-i", referencePath);

  const prompt = options.rewriteOnly ? buildPromptRewritePrompt(options) : buildImagePrompt(options);
  const writablePaths = options.rewriteOnly
    ? [options.promptPath, options.metadataPath]
    : [options.outputPath, options.promptPath, options.metadataPath];
  addWritableDirArgs(codexArgs, cwd, writablePaths);
  // `codex exec -i <image>` can greedily consume following positional tokens as
  // more image paths. Terminate options before passing the prompt so reference
  // images never swallow the prompt argument.
  codexArgs.push("--", prompt);

  for (const filePath of writablePaths) mkdirSync(dirname(filePath), { recursive: true });

  try {
    console.error(`${options.rewriteOnly ? "Rewriting prompt" : "Generating image"} via Codex (${options.model})...`);
    const result = spawnSync(codexCommand, codexArgs, { stdio: "inherit" });
    if (result.error) {
      console.error(result.error.message);
      return 1;
    }
    const code = typeof result.status === "number" ? result.status : 1;
    if (code !== 0) return code;

    const lastMessage = existsSync(lastMessagePath) ? readFileSync(lastMessagePath, "utf8").trim() : "";
    if (options.rewriteOnly) {
      const promptText = existsSync(options.promptPath) ? readFileSync(options.promptPath, "utf8") : lastMessage;
      if (!existsSync(options.promptPath)) writeFileSync(options.promptPath, `${promptText.trim()}\n`);
      if (!existsSync(options.metadataPath)) writeFallbackMetadata(options, promptText.trim());
      console.log(promptText.trim());
      console.log(`PROMPT_PATH: ${options.promptPath}`);
      console.log(`METADATA_PATH: ${options.metadataPath}`);
      return 0;
    }

    if (!existsSync(options.outputPath)) {
      console.error(`Codex finished but expected image was not found: ${options.outputPath}`);
      if (lastMessage) console.error(lastMessage);
      return 1;
    }
    if (!existsSync(options.promptPath)) writeFileSync(options.promptPath, `${buildImagePrompt(options)}\n`);
    if (!existsSync(options.metadataPath)) writeFallbackMetadata(options, readFileSync(options.promptPath, "utf8"));
    if (options.open && process.platform === "darwin") spawnSync("open", [options.outputPath], { stdio: "ignore" });
    console.log(`SAVED_PATH: ${options.outputPath}`);
    console.log(`PROMPT_PATH: ${options.promptPath}`);
    console.log(`METADATA_PATH: ${options.metadataPath}`);
    return 0;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

const cwd = process.cwd();
const options = parseArgs(process.argv.slice(2), cwd);
if (options.help) {
  console.log(usage);
  process.exit(0);
}
if (options.error) {
  console.error(options.error);
  process.exit(2);
}
const validationError = validateOptions(options);
if (validationError) {
  console.error(validationError);
  process.exit(2);
}
process.exit(runCodex(options, cwd));
