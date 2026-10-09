import * as fs from "fs";
import { outputToConsole } from "./ui";

export interface CleanupOptions {
  isDryRun: boolean;
  protectedPaths: string[];
}

// "./important-data/" and "important-data\" both mean "important-data"
const normalisePath = (target: string): string =>
  target
    .trim()
    .replace(/\\/g, "/")
    .replace(/^(\.\/)+/, "")
    .replace(/\/+$/, "");

const isSameOrInside = (target: string, parent: string): boolean =>
  parent.length > 0 && (target === parent || target.startsWith(parent + "/"));

// True when the target is a protected path or sits inside one
export function isPathProtected(
  target: string,
  protectedPaths: string[],
): boolean {
  const normalisedTarget = normalisePath(target);
  return protectedPaths.some((protectedPath) =>
    isSameOrInside(normalisedTarget, normalisePath(protectedPath)),
  );
}

// True when a protected path sits inside the target
export function containsProtectedPath(
  target: string,
  protectedPaths: string[],
): boolean {
  const normalisedTarget = normalisePath(target);
  return protectedPaths.some((protectedPath) => {
    const normalisedProtected = normalisePath(protectedPath);
    return (
      normalisedProtected !== normalisedTarget &&
      isSameOrInside(normalisedProtected, normalisedTarget)
    );
  });
}

export function filterProtectedTargets(
  targets: string[],
  protectedPaths: string[],
): string[] {
  return targets.filter((target) => !isPathProtected(target, protectedPaths));
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

// Files (not directories) in the project root whose name matches the glob
export function matchRootFiles(pattern: string): string[] {
  const matcher = globToRegExp(pattern);
  return fs
    .readdirSync(".", { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && matcher.test(dirent.name))
    .map((dirent) => dirent.name);
}

export function createCleanupTargetHandler(options: CleanupOptions) {
  const { isDryRun, protectedPaths } = options;
  let removedCount = 0;

  const removeTarget = (target: string): void => {
    outputToConsole(
      `${isDryRun ? "Would remove" : "Removing"} ${target}...`,
      "step",
    );
    try {
      if (!isDryRun) {
        fs.rmSync(target, { recursive: true, force: true });
      }
      outputToConsole(
        `${target} ${isDryRun ? "marked for removal (dry-run)" : "removed"}`,
        "success",
      );
      removedCount++;
    } catch {
      outputToConsole(`Failed to remove ${target}`, "fail");
    }
  };

  const holdsProtectedPath = (target: string): boolean =>
    containsProtectedPath(target, protectedPaths) &&
    fs.statSync(target).isDirectory();

  const cleanupTarget = (target: string): void => {
    if (!fs.existsSync(target) || isPathProtected(target, protectedPaths)) {
      return;
    }

    if (!holdsProtectedPath(target)) {
      removeTarget(target);
      return;
    }

    // Keep the protected entries and remove everything around them
    for (const entry of fs.readdirSync(target)) {
      cleanupTarget(`${normalisePath(target)}/${entry}`);
    }
  };

  return {
    removedCount: () => removedCount,
    cleanupTarget,
  };
}

export function processGlobPattern(
  pattern: string,
  handler: ReturnType<typeof createCleanupTargetHandler>,
) {
  try {
    matchRootFiles(pattern).forEach(handler.cleanupTarget);
  } catch (error) {
    outputToConsole(`Failed to process pattern ${pattern}: ${error}`, "warn");
  }
}
