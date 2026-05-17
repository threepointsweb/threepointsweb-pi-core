import type { ExtensionAPI, Skill } from "@earendil-works/pi-coding-agent";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  loadSkills,
  stripFrontmatter,
  truncateHead,
} from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Type } from "typebox";

const SEARCH_TOOL_NAME = "threepointsweb_skill_search";
const LOAD_TOOL_NAME = "threepointsweb_skill_load";
const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MIN_SCORE = 3;
const STATUS_KEY = "threepointsweb-skills";

const AGENT_DIR = join(homedir(), ".pi", "agent");
const EXTENSION_FILE = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = dirname(dirname(EXTENSION_FILE));

const STOPWORDS = new Set([
  "a",
  "as",
  "o",
  "os",
  "de",
  "da",
  "das",
  "do",
  "dos",
  "e",
  "ou",
  "para",
  "por",
  "com",
  "sem",
  "um",
  "uma",
  "como",
  "quando",
  "qual",
  "quais",
  "the",
  "and",
  "or",
  "for",
  "with",
  "without",
  "to",
  "of",
  "in",
  "on",
  "skill",
  "skills",
  "tarefa",
  "trabalho",
]);

interface SearchParams {
  query: string;
  maxResults?: number;
  minScore?: number;
  catalogPaths?: string[];
  refresh?: boolean;
}

interface LoadParams {
  name?: string;
  path?: string;
  query?: string;
  catalogPaths?: string[];
  refresh?: boolean;
}

interface IndexedSkill extends Skill {
  normalizedName: string;
  normalizedDescription: string;
  normalizedPath: string;
}

interface RankedSkill {
  skill: IndexedSkill;
  score: number;
  availableViaSlashCommand: boolean;
}

interface SkillIndex {
  key: string;
  generatedAt: number;
  catalogPaths: string[];
  skills: IndexedSkill[];
  diagnostics: Array<{ type?: string; message: string; path?: string }>;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
  return Array.from(new Set(tokens));
}

function expandPath(input: string, cwd: string): string {
  const trimmed = input.trim();
  if (trimmed === "~") return homedir();
  if (trimmed.startsWith("~/")) return join(homedir(), trimmed.slice(2));
  if (trimmed.startsWith("~")) return join(homedir(), trimmed.slice(1));
  return isAbsolute(trimmed) ? trimmed : resolve(cwd, trimmed);
}

function canonicalPath(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return resolve(filePath);
  }
}

function pathExists(filePath: string): boolean {
  try {
    return existsSync(filePath);
  } catch {
    return false;
  }
}

function splitPathList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]/)
    .flatMap((chunk) => chunk.split(delimiter))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function collectAncestorSkillDirs(cwd: string): string[] {
  const dirs: string[] = [];
  let current = resolve(cwd);
  while (true) {
    dirs.push(join(current, ".pi", "skills"));
    dirs.push(join(current, ".agents", "skills"));

    if (pathExists(join(current, ".git"))) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return dirs;
}

function defaultCatalogPaths(cwd: string): string[] {
  return [
    ...splitPathList(process.env.THREEPOINTSWEB_PI_SKILLS_PATHS),
    ...splitPathList(process.env.THREEPOINTSWEB_SKILLS_PATHS),
    join(homedir(), ".pi", "agent", "skills"),
    join(homedir(), ".agents", "skills"),
    ...collectAncestorSkillDirs(cwd),
    join(PACKAGE_ROOT, "skills-catalog"),
    join(PACKAGE_ROOT, "skills"),
  ];
}

function dedupePaths(paths: string[], cwd: string, includeMissing: boolean): string[] {
  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const raw of paths) {
    const absolute = expandPath(raw, cwd);
    if (!includeMissing && !pathExists(absolute)) continue;
    const key = pathExists(absolute) ? canonicalPath(absolute) : absolute;
    if (seen.has(key)) continue;
    seen.add(key);
    resolved.push(absolute);
  }
  return resolved;
}

function buildCatalogPaths(cwd: string, extraPaths: string[] | undefined): string[] {
  const defaults = dedupePaths(defaultCatalogPaths(cwd), cwd, false);
  const extras = dedupePaths(extraPaths ?? [], cwd, true);
  return dedupePaths([...extras, ...defaults], cwd, true);
}

function indexSkill(skill: Skill): IndexedSkill {
  return {
    ...skill,
    normalizedName: normalizeText(skill.name),
    normalizedDescription: normalizeText(skill.description),
    normalizedPath: canonicalPath(skill.filePath),
  };
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function scoreSkill(skill: IndexedSkill, query: string, queryTokens: string[]): number {
  const normalizedQuery = normalizeText(query).trim();
  const name = skill.normalizedName;
  const description = skill.normalizedDescription;
  const path = normalizeText(skill.filePath);
  let score = 0;

  if (name === normalizedQuery) score += 100;
  if (name.includes(normalizedQuery)) score += 40;
  if (description.includes(normalizedQuery)) score += 18;
  if (path.includes(normalizedQuery)) score += 5;

  const nameTokens = tokenize(skill.name.replace(/[-_]/g, " "));
  const combined = `${name} ${description} ${path}`;

  for (const token of queryTokens) {
    if (nameTokens.includes(token)) score += 14;
    else if (name.includes(token)) score += 9;

    if (description.includes(token)) score += 4;
    if (path.includes(token)) score += 1;
  }

  const coveredTokens = queryTokens.filter((token) => combined.includes(token)).length;
  if (queryTokens.length > 0) {
    score += Math.round((coveredTokens / queryTokens.length) * 10);
  }

  return score;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function threepointswebPiSkills(pi: ExtensionAPI) {
  let cachedIndex: SkillIndex | undefined;
  let lastPromptSkills: Skill[] = [];

  pi.on("before_agent_start", async (event) => {
    lastPromptSkills = event.systemPromptOptions.skills ?? [];
  });

  function commandSkillNames(): Set<string> {
    try {
      return new Set(
        pi
          .getCommands()
          .filter((command) => command.source === "skill")
          .map((command) => command.name.replace(/^skill:/, "")),
      );
    } catch {
      return new Set();
    }
  }

  function buildIndexKey(catalogPaths: string[]): string {
    const activeSkillPaths = lastPromptSkills.map((skill) => canonicalPath(skill.filePath)).sort();
    return [...catalogPaths.map(canonicalPath).sort(), "--active--", ...activeSkillPaths].join("\n");
  }

  function getIndex(cwd: string, params?: { catalogPaths?: string[]; refresh?: boolean }): SkillIndex {
    const catalogPaths = buildCatalogPaths(cwd, params?.catalogPaths);
    const key = buildIndexKey(catalogPaths);
    if (!params?.refresh && cachedIndex?.key === key) {
      return cachedIndex;
    }

    const diagnostics: SkillIndex["diagnostics"] = [];
    const loaded = loadSkills({
      cwd,
      agentDir: AGENT_DIR,
      skillPaths: catalogPaths,
      includeDefaults: false,
    });
    diagnostics.push(...loaded.diagnostics.map((diagnostic) => ({
      type: diagnostic.type,
      message: diagnostic.message,
      path: diagnostic.path,
    })));

    const byPath = new Map<string, IndexedSkill>();
    for (const skill of [...loaded.skills, ...lastPromptSkills]) {
      const indexed = indexSkill(skill);
      if (!byPath.has(indexed.normalizedPath)) {
        byPath.set(indexed.normalizedPath, indexed);
      }
    }

    cachedIndex = {
      key,
      generatedAt: Date.now(),
      catalogPaths,
      skills: Array.from(byPath.values()).sort((a, b) => a.name.localeCompare(b.name)),
      diagnostics,
    };
    return cachedIndex;
  }

  function rankSkills(index: SkillIndex, query: string, maxResults: number, minScore: number): RankedSkill[] {
    const tokens = tokenize(query);
    const slashCommandNames = commandSkillNames();
    return index.skills
      .map((skill) => ({
        skill,
        score: scoreSkill(skill, query, tokens),
        availableViaSlashCommand: slashCommandNames.has(skill.name),
      }))
      .filter((ranked) => ranked.score >= minScore)
      .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
      .slice(0, maxResults);
  }

  function findSkill(index: SkillIndex, params: LoadParams, cwd: string): RankedSkill | undefined {
    const slashCommandNames = commandSkillNames();
    if (params.path) {
      const target = canonicalPath(expandPath(params.path, cwd));
      const skill = index.skills.find((candidate) => candidate.normalizedPath === target);
      return skill ? { skill, score: 100, availableViaSlashCommand: slashCommandNames.has(skill.name) } : undefined;
    }

    if (params.name) {
      const normalizedName = normalizeText(params.name);
      const skill = index.skills.find((candidate) => candidate.normalizedName === normalizedName || candidate.name === params.name);
      return skill ? { skill, score: 100, availableViaSlashCommand: slashCommandNames.has(skill.name) } : undefined;
    }

    if (params.query) {
      return rankSkills(index, params.query, 1, DEFAULT_MIN_SCORE)[0];
    }

    return undefined;
  }

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, "skills: on-demand");
  });

  pi.registerTool({
    name: SEARCH_TOOL_NAME,
    label: "Skill Search",
    description:
      "Search an on-demand skill catalog by task description. Returns concise metadata and load instructions without putting every skill body in context.",
    promptSnippet: "Search the on-demand skill catalog by task description before loading a full skill.",
    promptGuidelines: [
      `Use ${SEARCH_TOOL_NAME} when a task may have a specialized skill but the available skills list is missing, too large, or uncertain.`,
      `After ${SEARCH_TOOL_NAME} returns a strong candidate, use ${LOAD_TOOL_NAME} to load exactly one selected skill before following it.`,
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Task, intent, or capability to search for." }),
      maxResults: Type.Optional(Type.Number({ description: "Maximum candidates to return (1-20). Defaults to 5." })),
      minScore: Type.Optional(Type.Number({ description: "Minimum internal match score. Defaults to 3." })),
      catalogPaths: Type.Optional(
        Type.Array(Type.String({ description: "Additional skill catalog file or directory path to search." })),
      ),
      refresh: Type.Optional(Type.Boolean({ description: "Rebuild the in-memory metadata index before searching." })),
    }),
    async execute(_toolCallId, params: SearchParams, signal, _onUpdate, ctx) {
      if (signal?.aborted) {
        return { content: [{ type: "text", text: "Skill search cancelled." }], details: { cancelled: true } };
      }

      const maxResults = Math.min(20, Math.max(1, Math.floor(params.maxResults ?? DEFAULT_MAX_RESULTS)));
      const minScore = Math.max(0, params.minScore ?? DEFAULT_MIN_SCORE);
      const index = getIndex(ctx.cwd, params);
      const ranked = rankSkills(index, params.query, maxResults, minScore);
      const hasStrongMatch = ranked.length > 0;

      const lines: string[] = [];
      lines.push(`${hasStrongMatch ? "Sim" : "Não"}: ${hasStrongMatch ? "há skill candidata" : "nenhuma skill forte encontrada"} para "${params.query}".`);
      lines.push(`Índice: ${index.skills.length} skill(s) por metadados em ${index.catalogPaths.length} caminho(s); corpos completos não foram carregados.`);

      if (ranked.length > 0) {
        lines.push("");
        lines.push("Candidatas:");
        ranked.forEach((candidate, indexNumber) => {
          const slash = candidate.availableViaSlashCommand ? `; slash: /skill:${candidate.skill.name}` : "";
          lines.push(
            `${indexNumber + 1}. ${candidate.skill.name} (score ${candidate.score}${slash})\n` +
              `   ${truncateText(candidate.skill.description, 260)}\n` +
              `   path: ${candidate.skill.filePath}\n` +
              `   load: ${LOAD_TOOL_NAME} {"path":"${candidate.skill.filePath}"}`,
          );
        });
        lines.push("");
        lines.push(`Próximo passo recomendado: chame ${LOAD_TOOL_NAME} com a melhor candidata antes de executar o fluxo da skill.`);
      } else {
        lines.push("Prossiga sem skill especializada ou refaça a busca com termos mais específicos/catálogo adicional.");
      }

      if (index.diagnostics.length > 0) {
        lines.push("");
        lines.push(`Avisos de catálogo: ${index.diagnostics.length}. Primeiro aviso: ${index.diagnostics[0]?.message}${index.diagnostics[0]?.path ? ` (${index.diagnostics[0].path})` : ""}`);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
        details: {
          query: params.query,
          generatedAt: new Date(index.generatedAt).toISOString(),
          catalogPaths: index.catalogPaths,
          totalSkills: index.skills.length,
          candidates: ranked.map((candidate) => ({
            name: candidate.skill.name,
            description: candidate.skill.description,
            filePath: candidate.skill.filePath,
            baseDir: candidate.skill.baseDir,
            score: candidate.score,
            availableViaSlashCommand: candidate.availableViaSlashCommand,
          })),
          diagnostics: index.diagnostics.slice(0, 20),
        },
      };
    },
  });

  pi.registerTool({
    name: LOAD_TOOL_NAME,
    label: "Skill Load",
    description:
      "Load exactly one skill selected from the on-demand catalog by name, path, or query. Returns only that skill body with its reference directory.",
    promptSnippet: "Load one selected on-demand skill body after searching the skill catalog.",
    promptGuidelines: [
      `Use ${LOAD_TOOL_NAME} only after selecting one skill candidate; do not load many skills speculatively.`,
      `${LOAD_TOOL_NAME} returns a skill block whose relative references must be resolved against the reported skill directory.`,
    ],
    parameters: Type.Object({
      name: Type.Optional(Type.String({ description: "Exact skill name to load." })),
      path: Type.Optional(Type.String({ description: "Exact SKILL.md or markdown skill path returned by the search tool." })),
      query: Type.Optional(Type.String({ description: "Fallback task query; loads the best matching candidate." })),
      catalogPaths: Type.Optional(
        Type.Array(Type.String({ description: "Additional skill catalog file or directory path to search." })),
      ),
      refresh: Type.Optional(Type.Boolean({ description: "Rebuild the in-memory metadata index before loading." })),
    }),
    async execute(_toolCallId, params: LoadParams, signal, _onUpdate, ctx) {
      if (signal?.aborted) {
        return { content: [{ type: "text", text: "Skill load cancelled." }], details: { cancelled: true } };
      }

      if (!params.name && !params.path && !params.query) {
        throw new Error(`Provide one of: name, path, or query for ${LOAD_TOOL_NAME}.`);
      }

      const index = getIndex(ctx.cwd, params);
      const ranked = findSkill(index, params, ctx.cwd);
      if (!ranked) {
        throw new Error(`No indexed skill matched ${params.path ?? params.name ?? params.query}. Run ${SEARCH_TOOL_NAME} first or add catalogPaths.`);
      }

      const { skill } = ranked;
      if (!pathExists(skill.filePath)) {
        throw new Error(`Indexed skill file no longer exists: ${skill.filePath}`);
      }
      const stats = statSync(skill.filePath);
      if (!stats.isFile()) {
        throw new Error(`Indexed skill path is not a file: ${skill.filePath}`);
      }

      const raw = readFileSync(skill.filePath, "utf8");
      const body = stripFrontmatter(raw).trim();
      const skillBlock = `<skill name="${escapeXmlAttribute(skill.name)}" location="${escapeXmlAttribute(skill.filePath)}">\nReferences are relative to ${skill.baseDir}.\n\n${body}\n</skill>`;
      const truncated = truncateHead(skillBlock, {
        maxBytes: DEFAULT_MAX_BYTES,
        maxLines: DEFAULT_MAX_LINES,
      });

      const text = [
        `Loaded skill: ${skill.name}`,
        `Location: ${skill.filePath}`,
        `References relative to: ${skill.baseDir}`,
        ranked.availableViaSlashCommand ? `Also available as: /skill:${skill.name}` : undefined,
        "",
        truncated.content,
        truncated.truncated
          ? `\n[Skill content truncated: ${truncated.outputLines} of ${truncated.totalLines} lines (${truncated.outputBytes} of ${truncated.totalBytes} bytes). Use read on ${skill.filePath} for the remaining content if needed.]`
          : undefined,
      ]
        .filter((line): line is string => line !== undefined)
        .join("\n");

      return {
        content: [{ type: "text", text }],
        details: {
          name: skill.name,
          description: skill.description,
          filePath: skill.filePath,
          baseDir: skill.baseDir,
          score: ranked.score,
          availableViaSlashCommand: ranked.availableViaSlashCommand,
          truncated: truncated.truncated,
        },
      };
    },
  });
}
