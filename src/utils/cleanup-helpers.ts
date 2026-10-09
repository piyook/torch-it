import * as fs from "fs";
import * as path from "path";
import { outputToConsole } from "./ui";

export interface CleanupOptions {
  isDryRun: boolean;
  protectedPaths: string[];
}

// Project-relative path with "/" separators, so "./dist/", "dist\" and
// "apps/../dist" are all "dist". "" is the project root; a leading ".." is outside it.
const normalisePath = (target: string): string =>
  path
    .relative(
      process.cwd(),
      path.resolve(target.trim().replace(/\\/g, path.sep)),
    )
    .replace(/\\/g, "/");

// Compared without case: on Windows and macOS "Dist" and "dist" are one folder,
// and elsewhere protecting both is the safe side to err on.
const comparisonKey = (target: string): string =>
  normalisePath(target).toLowerCase();

const isSameOrInside = (target: string, parent: string): boolean =>
  parent === "" || target === parent || target.startsWith(parent + "/");

// False for the project root itself and for anything outside it
export function isInsideProject(target: string): boolean {
  const relative = normalisePath(target);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith("../") &&
    !path.isAbsolute(relative)
  );
}

// True when the target is a protected path or sits inside one
export function isPathProtected(
  target: string,
  protectedPaths: string[],
): boolean {
  const targetKey = comparisonKey(target);
  return protectedPaths.some((protectedPath) =>
    isSameOrInside(targetKey, comparisonKey(protectedPath)),
  );
}

// True when a protected path sits inside the target
export function containsProtectedPath(
  target: string,
  protectedPaths: string[],
): boolean {
  const targetKey = comparisonKey(target);
  return protectedPaths.some((protectedPath) => {
    const protectedKey = comparisonKey(protectedPath);
    return (
      protectedKey !== targetKey && isSameOrInside(protectedKey, targetKey)
    );
  });
}

export function filterProtectedTargets(
  targets: string[],
  protectedPaths: string[],
): string[] {
  return targets.filter((target) => !isPathProtected(target, protectedPaths));
}

// A protected path that is not on disk has nothing to keep
export function existingPaths(paths: string[]): string[] {
  return paths.filter((entry) => fs.existsSync(entry));
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
  const existingProtectedPaths = existingPaths(protectedPaths);
  let removedCount = 0;
  let failedCount = 0;

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
      failedCount++;
    }
  };

  // Keep the protected entries and remove everything around them
  const removeAroundProtectedPaths = (target: string): void => {
    // Walking a link would empty the folder it points to, which may be elsewhere
    if (fs.lstatSync(target).isSymbolicLink()) {
      outputToConsole(
        `Skipping ${target}: it is a link and a protected path lies inside it`,
        "warn",
      );
      return;
    }

    for (const entry of fs.readdirSync(target)) {
      cleanupTarget(`${normalisePath(target)}/${entry}`);
    }
  };

  const cleanupTarget = (target: string): void => {
    if (!fs.existsSync(target) || isPathProtected(target, protectedPaths)) {
      return;
    }

    if (!isInsideProject(target)) {
      outputToConsole(`Skipping ${target}: not inside the project`, "warn");
      return;
    }

    if (!containsProtectedPath(target, existingProtectedPaths)) {
      removeTarget(target);
      return;
    }

    try {
      removeAroundProtectedPaths(target);
    } catch {
      outputToConsole(`Failed to read ${target}`, "fail");
      failedCount++;
    }
  };

  return {
    removedCount: () => removedCount,
    failedCount: () => failedCount,
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
