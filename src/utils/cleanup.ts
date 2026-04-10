import { outputToConsole } from "./ui";
import * as fs from "fs";
import { BUILD_DIRS, CACHE_DIRS, CUSTOM_DIRS } from "../constants/config";
import { hasCmd, run } from "./system";

const cleanupBuildsAndCaches = () => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  let removedCount = 0;
  outputToConsole("Scanning for build artifacts and cache directories...", "step");
  [...BUILD_DIRS, ...CACHE_DIRS, ...CUSTOM_DIRS].forEach((dir) => {
    if (fs.existsSync(dir)) {
      outputToConsole(`${isDryRun ? "Would remove" : "Removing"} ${dir}...`, "step");
      try {
        if (!isDryRun) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
        outputToConsole(
          `${dir} ${isDryRun ? "marked for removal (dry-run)" : "removed"}`,
          "success",
        );
        removedCount++;
      } catch {
        outputToConsole(`Failed to remove ${dir}`, "fail");
      }
    }
  });

  if (removedCount === 0) {
    outputToConsole(
      "No build artifacts or cache directories found (project already clean)",
      "info",
    );
    return false;
  }

  outputToConsole(`Removed ${removedCount} build/cache directories`, "success");
  return true;
};

const cleanupPackageManagerCaches = () => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  let cacheCleaned = false;
  if (hasCmd("npm")) {
    if (isDryRun || run("npm cache clean --force")) {
      outputToConsole(isDryRun ? "Dry-run: would clean npm cache" : "npm cache cleaned", "success");
      cacheCleaned = true;
    }
  }
  if (hasCmd("yarn")) {
    if (isDryRun || run("yarn cache clean")) {
      outputToConsole(
        isDryRun ? "Dry-run: would clean yarn cache" : "yarn cache cleaned",
        "success",
      );
      cacheCleaned = true;
    }
  }
  if (hasCmd("pnpm")) {
    if (isDryRun || run("pnpm store prune")) {
      outputToConsole(
        isDryRun ? "Dry-run: would clean pnpm store" : "pnpm store cleaned",
        "success",
      );
      cacheCleaned = true;
    }
  }
  if (!cacheCleaned)
    outputToConsole("No package manager caches cleaned (tools not available)", "info");
  return cacheCleaned;
};

export { cleanupBuildsAndCaches, cleanupPackageManagerCaches };
