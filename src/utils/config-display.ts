import * as fs from "fs";
import { outputToConsole } from "./ui";
import { getCustomPaths } from "./torchrc";
import {
  describeTrackedLocations,
  getCleanupPlan,
  getRunProtection,
} from "./targets";
import type { CleanupPlan } from "./targets";
import {
  createProtectionIndex,
  existingPaths,
  filterProtectedTargets,
  matchRootFiles,
} from "./cleanup-helpers";
import { DOCKER_FILES } from "./docker";
import {
  describePackageManager,
  detectPackageManager,
} from "./package-managers";
import type { TorchRcConfig } from "../types";

const info = (message: string) => outputToConsole(message, "info");

const describePath = (target: string): string => {
  if (!fs.existsSync(target)) return "(not found)";
  return fs.statSync(target).isDirectory() ? "(DIR)" : "(FILE)";
};

function showPackageManagers(): void {
  info("\nPACKAGE MANAGER:");
  const packageManager = detectPackageManager();

  if (packageManager) {
    info(`  ${describePackageManager(packageManager)}`);
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

function showGlobPattern(pattern: string, protectedPaths: string[]): void {
  try {
    const files = filterProtectedTargets(
      matchRootFiles(pattern),
      protectedPaths,
    );
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
  const keptOnDisk = createProtectionIndex(existingPaths(protectedPaths));
  targets.forEach((target) => {
    const note = keptOnDisk.holds(target) ? " - protected contents kept" : "";
    info(`    ${target} ${describePath(target)}${note}`);
  });
}

function showDeletionTargets(
  plan: CleanupPlan,
  protectedPaths: string[],
): void {
  info("\nFILES/DIRECTORIES THAT WILL BE DELETED:");

  const existingUnprotected = (targets: string[]) =>
    filterProtectedTargets(targets, protectedPaths).filter((target) =>
      fs.existsSync(target),
    );

  // Separate regular targets from glob patterns
  const regularTargets = existingUnprotected([
    ...plan.defaultTargets,
    ...plan.filePatterns.filter((pattern) => !pattern.includes("*")),
  ]);
  const globPatterns = plan.filePatterns.filter((pattern) =>
    pattern.includes("*"),
  );
  const customTargets = existingUnprotected(plan.customTargets);

  showTargetList("  Default targets:", regularTargets, protectedPaths);

  if (globPatterns.length > 0) {
    info("  Glob patterns:");
    globPatterns.forEach((pattern) => showGlobPattern(pattern, protectedPaths));
  }

  showTargetList(
    plan.onlyMode
      ? "  Only these (nothing else is removed):"
      : "  Custom targets:",
    customTargets,
    protectedPaths,
  );

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
  info(`  Docker Volumes: ${config.dockerVolumes}`);
  info(`  Cache Clean: ${config.cacheClean}`);
  info(`  Allow Tracked: ${config.allowTracked}`);
  info(`  Rebuild: ${config.rebuild}`);
  info(`  Logfile: ${config.logfile}`);

  showPackageManagers();
  showDockerFiles();
  const plan = getCleanupPlan(config);
  const protection = getRunProtection(config, plan);
  showDeletionTargets(plan, protection.protectedPaths);
  if (protection.trackedFiles.length > 0) {
    info(
      `  Kept: ${protection.trackedFiles.length} file(s) tracked in git, under: ${describeTrackedLocations(protection.trackedFiles)}`,
    );
  }

  if (protectedPaths.length > 0) {
    showPathList("\nPROTECTED PATHS (will NOT be deleted):", protectedPaths);
  } else {
    info("\nPROTECTED PATHS: None");
  }

  if (customPaths.length > 0) {
    showPathList("\nCUSTOM PATHS:", customPaths);
  }

  if (config.only.length > 0) {
    showPathList("\nONLY (replaces the default targets):", config.only);
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
