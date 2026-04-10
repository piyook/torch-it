import { outputToConsole } from "./ui";
import * as fs from "fs";
import { BUILD_DIRS, CACHE_DIRS } from "../constants/config";
import { hasCmd, run } from "./system";

const cleanupBuildsAndCaches = () => {
  let removedCount = 0;
  outputToConsole(
    "Scanning for build artifacts and cache directories...",
    "step"
  );
  [...BUILD_DIRS, ...CACHE_DIRS].forEach((dir) => {
    if (fs.existsSync(dir)) {
      outputToConsole(`Removing ${dir}...`, "step");
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        outputToConsole(`${dir} removed`, "success");
        removedCount++;
      } catch {
        outputToConsole(`Failed to remove ${dir}`, "fail");
      }
    }
  });

  if (removedCount === 0) {
    outputToConsole(
      "No build artifacts or cache directories found (project already clean)",
      "info"
    );
    return false;
  }

  outputToConsole(`Removed ${removedCount} build/cache directories`, "success");
  return true;
};

const cleanupPackageManagerCaches = () => {
  let cacheCleaned = false;
  if (hasCmd("npm")) {
    if (run("npm cache clean --force")) {
      outputToConsole("npm cache cleaned", "success");
      cacheCleaned = true;
    }
  }
  if (hasCmd("yarn")) {
    if (run("yarn cache clean")) {
      outputToConsole("yarn cache cleaned", "success");
      cacheCleaned = true;
    }
  }
  if (hasCmd("pnpm")) {
    if (run("pnpm store prune")) {
      outputToConsole("pnpm store cleaned", "success");
      cacheCleaned = true;
    }
  }
  if (!cacheCleaned)
    outputToConsole(
      "No package manager caches cleaned (tools not available)",
      "info"
    );
  return cacheCleaned;
};

export { cleanupBuildsAndCaches, cleanupPackageManagerCaches };
