import { outputToConsole } from "./ui";
import { cleanPackageManagerCache } from "./package-managers";
import type { PackageManager } from "./package-managers";
import type { TorchRcConfig } from "../types";
import {
  describeTrackedLocations,
  getCleanupPlan,
  getRunProtection,
} from "./targets";
import {
  createCleanupTargetHandler,
  filterProtectedTargets,
  processGlobPattern,
} from "./cleanup-helpers";

type CleanupHandler = ReturnType<typeof createCleanupTargetHandler>;

const removeFilePatterns = (
  filePatterns: string[],
  handler: CleanupHandler,
): void => {
  if (filePatterns.length === 0) return;

  outputToConsole("Scanning for log files and temporary files...", "step");
  for (const pattern of filePatterns) {
    if (pattern.includes("*")) {
      processGlobPattern(pattern, handler);
    } else {
      // Handle non-glob patterns (like tsconfig.tsbuildinfo)
      handler.cleanupTarget(pattern);
    }
  }
};

const reportCleanup = (handler: CleanupHandler, isDryRun: boolean) => {
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

const cleanupBuildsAndCaches = (torchRcConfig: Required<TorchRcConfig>) => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  const plan = getCleanupPlan(torchRcConfig);
  const { protectedPaths, trackedFiles } = getRunProtection(
    torchRcConfig,
    plan,
  );

  // Filter out protected paths
  const defaultTargets = filterProtectedTargets(
    plan.defaultTargets,
    protectedPaths,
  );
  const customTargets = filterProtectedTargets(
    plan.customTargets,
    protectedPaths,
  );

  const handler = createCleanupTargetHandler({ isDryRun, protectedPaths });

  if (!plan.onlyMode) {
    outputToConsole(
      "Scanning for build artifacts and cache directories...",
      "step",
    );
    defaultTargets.forEach(handler.cleanupTarget);
  }

  removeFilePatterns(plan.filePatterns, handler);

  if (customTargets.length > 0) {
    outputToConsole(
      plan.onlyMode
        ? "Removing only the paths listed in 'only'"
        : "Deleting user defined custom directories and files",
      "step",
    );
    customTargets.forEach(handler.cleanupTarget);
  }

  // Report protected paths
  const totalProtected =
    plan.defaultTargets.length -
    defaultTargets.length +
    (plan.customTargets.length - customTargets.length);
  if (totalProtected > 0) {
    outputToConsole(`Skipped ${totalProtected} protected path(s)`, "info");
  }

  if (trackedFiles.length > 0) {
    outputToConsole(
      `Kept ${trackedFiles.length} file(s) tracked in git, under: ${describeTrackedLocations(trackedFiles)}. Pass --allowTracked=true to remove them too.`,
      "warn",
    );
  }

  return { ...reportCleanup(handler, isDryRun), tracked: trackedFiles.length };
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
