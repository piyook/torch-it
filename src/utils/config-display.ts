import * as fs from "fs";
import { outputToConsole } from "./ui";
import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import { getCustomPaths } from "./torchrc";
import {
  containsProtectedPath,
  filterProtectedTargets,
  matchRootFiles,
} from "./cleanup-helpers";
import { DOCKER_FILES } from "./docker";
import { PACKAGE_MANAGERS } from "./package-managers";
import { hasCmd } from "./system";
import type { TorchRcConfig } from "../types";

const info = (message: string) => outputToConsole(message, "info");

const describePath = (target: string): string => {
  if (!fs.existsSync(target)) return "(not found)";
  return fs.statSync(target).isDirectory() ? "(DIR)" : "(FILE)";
};

function showPackageManagers(): void {
  info("\nPACKAGE MANAGER DETECTION:");
  const packageManagers = Object.values(PACKAGE_MANAGERS)
    .filter((pm) => hasCmd(pm.name))
    .map(
      (pm) =>
        `${pm.name} (${fs.existsSync(pm.lockFile) ? pm.lockFile : "fallback"})`,
    );

  if (packageManagers.length > 0) {
    packageManagers.forEach((pm) => info(`  ${pm}`));
  } else {
    outputToConsole("  No package manager detected", "warn");
  }
}

function showDockerFiles(): void {
  info("\nDOCKER DETECTION:");
  const foundDockerFiles = DOCKER_FILES.filter((file) => fs.existsSync(file));
  if (foundDockerFiles.length > 0) {
    foundDockerFiles.forEach((file) => info(`  ${file}`));
  } else {
    info("  No Docker configuration found");
  }
}

function showGlobPattern(pattern: string): void {
  try {
    const files = matchRootFiles(pattern);
    if (files.length === 0) {
      info(`    ${pattern} (no matches)`);
      return;
    }
    info(
      `    ${pattern} (matches ${files.length} file${files.length === 1 ? "" : "s"}):`,
    );
    files.forEach((file) => info(`      ${file} (FILE)`));
  } catch (error) {
    outputToConsole(`    ${pattern} (error: ${error})`, "warn");
  }
}

function showTargetList(
  title: string,
  targets: string[],
  protectedPaths: string[],
): void {
  if (targets.length === 0) return;
  info(title);
  targets.forEach((target) => {
    const note = containsProtectedPath(target, protectedPaths)
      ? " - protected contents kept"
      : "";
    info(`    ${target} ${describePath(target)}${note}`);
  });
}

function showDeletionTargets(
  customPaths: string[],
  protectedPaths: string[],
): void {
  info("\nFILES/DIRECTORIES THAT WILL BE DELETED:");

  const defaultTargets = filterProtectedTargets(
    [
      ...new Set([
        ...BUILD_DIRS,
        ...CACHE_DIRS,
        ...CUSTOM_DIRS,
        ...FILE_PATTERNS,
      ]),
    ],
    protectedPaths,
  );

  // Separate regular targets from glob patterns
  const regularTargets = defaultTargets.filter(
    (target) => !target.includes("*") && fs.existsSync(target),
  );
  const globPatterns = defaultTargets.filter((target) => target.includes("*"));
  const customTargets = filterProtectedTargets(
    customPaths,
    protectedPaths,
  ).filter((target) => fs.existsSync(target));

  showTargetList("  Default targets:", regularTargets, protectedPaths);

  if (globPatterns.length > 0) {
    info("  Glob patterns:");
    globPatterns.forEach(showGlobPattern);
  }

  showTargetList("  Custom targets:", customTargets, protectedPaths);

  if (
    regularTargets.length === 0 &&
    globPatterns.length === 0 &&
    customTargets.length === 0
  ) {
    info("  No targets found (nothing to delete)");
  }
}

function showPathList(title: string, paths: string[]): void {
  info(title);
  paths.forEach((target) => info(`  ${target} ${describePath(target)}`));
}

export function renderTorchConfigDisplay(
  config: Required<TorchRcConfig>,
  options?: { includeHelpFooter?: boolean },
): void {
  const includeHelpFooter = options?.includeHelpFooter !== false;
  const customPaths = getCustomPaths(config);
  const protectedPaths = config.protectedPaths;

  info("=".repeat(60));
  info("TORCH-IT CONFIGURATION");
  info("=".repeat(60));

  info("\nBASIC SETTINGS:");
  info(`  Docker Mode: ${config.dockerMode}`);
  info(`  Rebuild: ${config.rebuild}`);
  info(`  Logfile: ${config.logfile}`);

  showPackageManagers();
  showDockerFiles();
  showDeletionTargets(customPaths, protectedPaths);

  if (protectedPaths.length > 0) {
    showPathList("\nPROTECTED PATHS (will NOT be deleted):", protectedPaths);
  } else {
    info("\nPROTECTED PATHS: None");
  }

  if (customPaths.length > 0) {
    showPathList("\nCUSTOM PATHS:", customPaths);
  }

  info("\n" + "=".repeat(60));
  if (includeHelpFooter) {
    info("Use 'torch-it --help' for available options");
    info("=".repeat(60));
  }
}

export const showConfig = (config: Required<TorchRcConfig>) => {
  renderTorchConfigDisplay(config);
};
