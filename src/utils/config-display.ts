import * as fs from "fs";
import { outputToConsole } from "./ui";
import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import { getTorchRcConfigFromFile } from "./cleanup";
import { hasCmd } from "./system";
import type { TorchRcConfig } from "../types";

function customPathsFromConfig(config: Required<TorchRcConfig>): string[] {
  return [...config.customPaths, ...config.customDirs, ...config.customFiles]
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function renderTorchConfigDisplay(
  config: Required<TorchRcConfig>,
  options?: { includeHelpFooter?: boolean },
): void {
  const includeHelpFooter = options?.includeHelpFooter !== false;
  const customPaths = customPathsFromConfig(config);
  const protectedPaths = config.protectedPaths;

  outputToConsole("=".repeat(60), "info");
  outputToConsole("TORCH-IT CONFIGURATION", "info");
  outputToConsole("=".repeat(60), "info");

  // Basic Settings
  outputToConsole("\nBASIC SETTINGS:", "info");
  outputToConsole(`  Docker Mode: ${config.dockerMode}`, "info");
  outputToConsole(`  Rebuild: ${config.rebuild}`, "info");
  outputToConsole(`  Logfile: ${config.logfile}`, "info");

  // Package Manager Detection
  outputToConsole("\nPACKAGE MANAGER DETECTION:", "info");
  const packageManagers = [];
  if (fs.existsSync("package-lock.json") && hasCmd("npm")) {
    packageManagers.push("npm (package-lock.json)");
  } else if (hasCmd("npm")) {
    packageManagers.push("npm (fallback)");
  }

  if (fs.existsSync("yarn.lock") && hasCmd("yarn")) {
    packageManagers.push("yarn (yarn.lock)");
  } else if (hasCmd("yarn")) {
    packageManagers.push("yarn (fallback)");
  }

  if (fs.existsSync("pnpm-lock.yaml") && hasCmd("pnpm")) {
    packageManagers.push("pnpm (pnpm-lock.yaml)");
  } else if (hasCmd("pnpm")) {
    packageManagers.push("pnpm (fallback)");
  }

  if (packageManagers.length > 0) {
    packageManagers.forEach((pm) => outputToConsole(`  ${pm}`, "info"));
  } else {
    outputToConsole("  No package manager detected", "warn");
  }

  // Docker Detection
  outputToConsole("\nDOCKER DETECTION:", "info");
  const dockerFiles = [
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
  ];
  const foundDockerFiles = dockerFiles.filter((file) => fs.existsSync(file));
  if (foundDockerFiles.length > 0) {
    foundDockerFiles.forEach((file) => outputToConsole(`  ${file}`, "info"));
  } else {
    outputToConsole("  No Docker configuration found", "info");
  }

  // Files to be deleted
  outputToConsole("\nFILES/DIRECTORIES THAT WILL BE DELETED:", "info");

  const defaultTargets = [
    ...new Set([
      ...BUILD_DIRS,
      ...CACHE_DIRS,
      ...CUSTOM_DIRS,
      ...FILE_PATTERNS,
    ]),
  ];

  // Filter out protected paths from default targets
  const filteredDefaultTargets = defaultTargets.filter(
    (target) =>
      !protectedPaths.some(
        (protectedPath) =>
          target === protectedPath || target.startsWith(protectedPath + "/"),
      ),
  );

  // Filter out protected paths from custom targets
  const filteredCustomTargets = customPaths.filter(
    (target) =>
      !protectedPaths.some(
        (protectedPath) =>
          target === protectedPath || target.startsWith(protectedPath + "/"),
      ),
  );

  // Separate regular targets from glob patterns
  const regularTargets = filteredDefaultTargets.filter(
    (target: string) => !target.includes("*") && fs.existsSync(target),
  );
  const globPatterns = filteredDefaultTargets.filter((target: string) =>
    target.includes("*"),
  );

  const existingCustomTargets = filteredCustomTargets.filter((target: string) =>
    fs.existsSync(target),
  );

  if (regularTargets.length > 0) {
    outputToConsole("  Default targets:", "info");
    regularTargets.forEach((target: string) => {
      const type = fs.statSync(target).isDirectory() ? "DIR" : "FILE";
      outputToConsole(`    ${target} (${type})`, "info");
    });
  }

  // Show glob patterns and matched files
  if (globPatterns.length > 0) {
    outputToConsole("  Glob patterns:", "info");
    globPatterns.forEach((pattern: string) => {
      try {
        const files = fs
          .readdirSync(".", { withFileTypes: true })
          .filter((dirent) => {
            const name = dirent.name;
            return name.match(pattern.replace("*", ".*"));
          })
          .map((dirent) => dirent.name);

        if (files.length > 0) {
          outputToConsole(
            `    ${pattern} (matches ${files.length} file${files.length === 1 ? "" : "s"}):`,
            "info",
          );
          files.forEach((file) => {
            outputToConsole(`      ${file} (FILE)`, "info");
          });
        } else {
          outputToConsole(`    ${pattern} (no matches)`, "info");
        }
      } catch (error) {
        outputToConsole(`    ${pattern} (error: ${error})`, "warn");
      }
    });
  }

  if (existingCustomTargets.length > 0) {
    outputToConsole("  Custom targets:", "info");
    existingCustomTargets.forEach((target: string) => {
      const type = fs.statSync(target).isDirectory() ? "DIR" : "FILE";
      outputToConsole(`    ${target} (${type})`, "info");
    });
  }

  if (
    regularTargets.length === 0 &&
    globPatterns.length === 0 &&
    existingCustomTargets.length === 0
  ) {
    outputToConsole("  No targets found (nothing to delete)", "info");
  }

  // Protected paths
  if (protectedPaths.length > 0) {
    outputToConsole("\nPROTECTED PATHS (will NOT be deleted):", "info");
    protectedPaths.forEach((path: string) => {
      const exists = fs.existsSync(path);
      const type = exists && fs.statSync(path).isDirectory() ? "DIR" : "FILE";
      const status = exists ? `(${type})` : "(not found)";
      outputToConsole(`  ${path} ${status}`, "info");
    });
  } else {
    outputToConsole("\nPROTECTED PATHS: None", "info");
  }

  // Custom paths from torchrc.json
  if (customPaths.length > 0) {
    outputToConsole("\nCUSTOM PATHS:", "info");
    customPaths.forEach((path: string) => {
      const exists = fs.existsSync(path);
      const type = exists && fs.statSync(path).isDirectory() ? "DIR" : "FILE";
      const status = exists ? `(${type})` : "(not found)";
      outputToConsole(`  ${path} ${status}`, "info");
    });
  }

  outputToConsole("\n" + "=".repeat(60), "info");
  if (includeHelpFooter) {
    outputToConsole("Use 'torch-it --help' for available options", "info");
    outputToConsole("=".repeat(60), "info");
  }
}

export const showConfig = () => {
  renderTorchConfigDisplay(getTorchRcConfigFromFile());
};
