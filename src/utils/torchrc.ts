import * as fs from "fs";
import { outputToConsole } from "./ui";
import type { TorchRcConfig } from "../types";
import { DEFAULT_TORCH_RC_CONFIG } from "../types";

const TORCH_RC_PATH = "torchrc.json";

const ARRAY_KEYS = [
  "customPaths",
  "customDirs",
  "customFiles",
  "protectedPaths",
] as const;
const BOOLEAN_KEYS = ["dockerMode", "logfile", "rebuild"] as const;

type ArrayKey = (typeof ARRAY_KEYS)[number];
type BooleanKey = (typeof BOOLEAN_KEYS)[number];

const isArrayKey = (key: string): key is ArrayKey =>
  (ARRAY_KEYS as readonly string[]).includes(key);
const isBooleanKey = (key: string): key is BooleanKey =>
  (BOOLEAN_KEYS as readonly string[]).includes(key);

const cleanPathList = (entries: string[]): string[] =>
  entries.map((entry) => entry.trim()).filter((entry) => entry.length > 0);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

// Applies one option to the config, or records why it was rejected.
const applyOption = (
  config: TorchRcConfig,
  key: string,
  value: unknown,
  label: string,
  problems: string[],
): void => {
  if (isArrayKey(key)) {
    if (isStringArray(value)) {
      config[key] = cleanPathList(value);
    } else {
      problems.push(`${label} must be an array of strings`);
    }
  } else if (isBooleanKey(key)) {
    if (typeof value === "boolean") {
      config[key] = value;
    } else {
      problems.push(`${label} must be true or false`);
    }
  } else {
    problems.push(`Unknown option ${label}`);
  }
};

// Shells strip the inner quotes from --customPaths=["a","b"], so accept
// [a,b] and a,b as well as valid JSON.
const parseCliList = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isStringArray(parsed)) return parsed;
  } catch {
    // Not JSON - fall through to the comma-separated form
  }
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["']$/g, ""));
};

const parseCliValue = (key: string, value: string | undefined): unknown => {
  if (isBooleanKey(key)) {
    if (value === undefined || value === "true") return true;
    return value === "false" ? false : value;
  }
  if (isArrayKey(key) && value) return parseCliList(value);
  return value;
};

const parseCliOverrides = (
  cliArgs: string[],
  problems: string[],
): TorchRcConfig => {
  const overrides: TorchRcConfig = {};

  for (const arg of cliArgs) {
    if (!arg.startsWith("--")) {
      problems.push(`Unknown argument ${arg}`);
      continue;
    }

    const separator = arg.indexOf("=");
    const key = separator === -1 ? arg.slice(2) : arg.slice(2, separator);
    const value = separator === -1 ? undefined : arg.slice(separator + 1);

    applyOption(
      overrides,
      key,
      parseCliValue(key, value),
      `--${key}`,
      problems,
    );
  }

  return overrides;
};

const loadTorchRcFile = (problems: string[]): TorchRcConfig => {
  if (!fs.existsSync(TORCH_RC_PATH)) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(TORCH_RC_PATH, "utf8"));
  } catch {
    problems.push(`${TORCH_RC_PATH} is not valid JSON`);
    return {};
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    problems.push(`${TORCH_RC_PATH} must contain a JSON object`);
    return {};
  }

  const config: TorchRcConfig = {};
  for (const [key, value] of Object.entries(parsed)) {
    applyOption(config, key, value, `${TORCH_RC_PATH} "${key}"`, problems);
  }
  return config;
};

export type ResolvedTorchRcConfig = {
  config: Required<TorchRcConfig>;
  problems: string[];
};

// CLI overrides take precedence over torchrc.json, which takes precedence over defaults
export const resolveTorchRcConfig = (
  cliArgs: string[] = [],
): ResolvedTorchRcConfig => {
  const problems: string[] = [];
  const fileConfig = loadTorchRcFile(problems);
  const cliOverrides = parseCliOverrides(cliArgs, problems);

  return {
    config: { ...DEFAULT_TORCH_RC_CONFIG, ...fileConfig, ...cliOverrides },
    problems,
  };
};

// A config we cannot trust could drop protectedPaths, so stop rather than guess
export const getTorchRcConfig = (
  cliArgs: string[] = [],
): Required<TorchRcConfig> => {
  const { config, problems } = resolveTorchRcConfig(cliArgs);

  if (problems.length > 0) {
    problems.forEach((problem) => outputToConsole(problem, "fail"));
    outputToConsole(
      "Nothing was changed. Fix the above or run 'torch-it --help'.",
      "info",
    );
    process.exit(1);
  }

  return config;
};

export const getCustomPaths = (config: Required<TorchRcConfig>): string[] => [
  ...new Set([
    ...config.customPaths,
    ...config.customDirs,
    ...config.customFiles,
  ]),
];
