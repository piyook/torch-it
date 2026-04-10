import { outputToConsole } from "./ui";
import * as fs from "fs";
import { BUILD_DIRS, CACHE_DIRS, CUSTOM_DIRS } from "../constants/config";
import { hasCmd, run } from "./system";

const loadTorchRcCustomPaths = (): string[] => {
  const torchRcPath = "torchrc.json";

  if (!fs.existsSync(torchRcPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(torchRcPath, "utf8")) as {
      customPaths?: unknown;
      customDirs?: unknown;
      customFiles?: unknown;
    };

    const rawPaths = [
      ...(Array.isArray(parsed.customPaths) ? parsed.customPaths : []),
      ...(Array.isArray(parsed.customDirs) ? parsed.customDirs : []),
      ...(Array.isArray(parsed.customFiles) ? parsed.customFiles : []),
    ];

    return rawPaths
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  } catch {
    outputToConsole("Invalid torchrc.json (must be valid JSON) - skipping custom paths", "warn");
    return [];
  }
};

const cleanupBuildsAndCaches = () => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  let removedCount = 0;
  const torchRcCustomPaths = loadTorchRcCustomPaths();
  const defaultTargets = [...new Set([...BUILD_DIRS, ...CACHE_DIRS, ...CUSTOM_DIRS])];
  const customTargets = [...new Set(torchRcCustomPaths)];

  const cleanupTarget = (target: string) => {
    if (fs.existsSync(target)) {
      outputToConsole(`${isDryRun ? "Would remove" : "Removing"} ${target}...`, "step");
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
    }
  };

  outputToConsole("Scanning for build artifacts and cache directories...", "step");
  defaultTargets.forEach(cleanupTarget);

  if (customTargets.length > 0) {
    outputToConsole("Deleting user defined custom directories and files", "step");
    customTargets.forEach(cleanupTarget);
  }

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
