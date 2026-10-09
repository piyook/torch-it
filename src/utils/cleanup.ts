import { outputToConsole } from "./ui";
import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import {
  detectPackageManager,
  cleanPackageManagerCache,
} from "./package-managers";
import type { TorchRcConfig } from "../types";
import { getCustomPaths } from "./torchrc";
import { LOG_FILE } from "./logger";
import {
  createCleanupTargetHandler,
  filterProtectedTargets,
  processGlobPattern,
} from "./cleanup-helpers";

const cleanupBuildsAndCaches = (torchRcConfig: Required<TorchRcConfig>) => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  // The log being written by this run must survive the *.log sweep
  const protectedPaths = torchRcConfig.logfile
    ? [...torchRcConfig.protectedPaths, LOG_FILE]
    : torchRcConfig.protectedPaths;

  const defaultTargets = [
    ...new Set([...BUILD_DIRS, ...CACHE_DIRS, ...CUSTOM_DIRS]),
  ];
  const customTargets = getCustomPaths(torchRcConfig);

  // Filter out protected paths
  const filteredDefaultTargets = filterProtectedTargets(
    defaultTargets,
    protectedPaths,
  );
  const filteredCustomTargets = filterProtectedTargets(
    customTargets,
    protectedPaths,
  );

  const handler = createCleanupTargetHandler({ isDryRun, protectedPaths });

  outputToConsole(
    "Scanning for build artifacts and cache directories...",
    "step",
  );
  filteredDefaultTargets.forEach(handler.cleanupTarget);

  outputToConsole("Scanning for log files and temporary files...", "step");

  for (const pattern of FILE_PATTERNS) {
    if (pattern.includes("*")) {
      processGlobPattern(pattern, handler);
    } else {
      // Handle non-glob patterns (like tsconfig.tsbuildinfo)
      handler.cleanupTarget(pattern);
    }
  }

  if (filteredCustomTargets.length > 0) {
    outputToConsole(
      "Deleting user defined custom directories and files",
      "step",
    );
    filteredCustomTargets.forEach(handler.cleanupTarget);
  }

  // Report protected paths
  const totalProtected =
    defaultTargets.length -
    filteredDefaultTargets.length +
    (customTargets.length - filteredCustomTargets.length);
  if (totalProtected > 0) {
    outputToConsole(`Skipped ${totalProtected} protected path(s)`, "info");
  }

  const removedCount = handler.removedCount();
  if (removedCount === 0) {
    outputToConsole(
      "No build artifacts or cache directories found (project already clean)",
      "info",
    );
    return false;
  }

  outputToConsole(
    `${isDryRun ? "Would remove" : "Removed"} ${removedCount} build/cache item(s)`,
    "success",
  );
  return true;
};

// Only the package manager this project uses - the others are not ours to clear
const cleanupPackageManagerCaches = () => {
  const packageManager = detectPackageManager();

  if (!packageManager) {
    outputToConsole(
      "No package manager cache cleaned (npm/yarn/pnpm not available)",
      "info",
    );
    return false;
  }

  return cleanPackageManagerCache(packageManager);
};

export { cleanupBuildsAndCaches, cleanupPackageManagerCaches };
