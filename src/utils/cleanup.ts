import { outputToConsole } from "./ui";
import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import { cleanPackageManagerCache } from "./package-managers";
import type { PackageManager } from "./package-managers";
import type { TorchRcConfig } from "../types";
import { getCustomPaths, getProtectedPaths } from "./torchrc";
import {
  createCleanupTargetHandler,
  filterProtectedTargets,
  processGlobPattern,
} from "./cleanup-helpers";

const cleanupBuildsAndCaches = (torchRcConfig: Required<TorchRcConfig>) => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  const protectedPaths = getProtectedPaths(torchRcConfig);

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
  const failedCount = handler.failedCount();
  if (failedCount > 0) {
    outputToConsole(
      `${failedCount} path(s) could not be removed - close anything using them and run again`,
      "fail",
    );
  } else if (removedCount === 0) {
    outputToConsole(
      "No build artifacts or cache directories found (project already clean)",
      "info",
    );
  }

  if (removedCount > 0) {
    outputToConsole(
      `${isDryRun ? "Would remove" : "Removed"} ${removedCount} build/cache item(s)`,
      "success",
    );
  }
  return { cleaned: removedCount > 0, failed: failedCount };
};

// Only the package manager this project uses - the others are not ours to clear
const cleanupPackageManagerCaches = (packageManager: PackageManager | null) => {
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
