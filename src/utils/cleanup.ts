import { outputToConsole } from "./ui";
import * as fs from "fs";
import { BUILD_DIRS, CACHE_DIRS, CUSTOM_DIRS } from "../constants/config";
import { hasCmd, run } from "./system";
import type { TorchRcConfig } from "../types";
import { DEFAULT_TORCH_RC_CONFIG } from "../types";

export const loadTorchRcConfig = (): TorchRcConfig => {
  const torchRcPath = "torchrc.json";

  if (!fs.existsSync(torchRcPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(torchRcPath, "utf8"),
    ) as TorchRcConfig;
    return parsed;
  } catch {
    outputToConsole(
      "Invalid torchrc.json (must be valid JSON) - skipping custom config",
      "warn",
    );
    return {};
  }
};

export const getTorchRcConfig = (): Required<TorchRcConfig> => {
  const userConfig = loadTorchRcConfig();
  return {
    customPaths: userConfig.customPaths ?? DEFAULT_TORCH_RC_CONFIG.customPaths,
    customDirs: userConfig.customDirs ?? DEFAULT_TORCH_RC_CONFIG.customDirs,
    customFiles: userConfig.customFiles ?? DEFAULT_TORCH_RC_CONFIG.customFiles,
    protectedPaths:
      userConfig.protectedPaths ?? DEFAULT_TORCH_RC_CONFIG.protectedPaths,
    dockerMode: userConfig.dockerMode ?? DEFAULT_TORCH_RC_CONFIG.dockerMode,
  };
};

const loadTorchRcCustomPaths = (): string[] => {
  const config = getTorchRcConfig();

  const rawPaths = [
    ...config.customPaths,
    ...config.customDirs,
    ...config.customFiles,
  ];

  return rawPaths
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const cleanupBuildsAndCaches = () => {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  let removedCount = 0;
  const torchRcConfig = getTorchRcConfig();
  const torchRcCustomPaths = loadTorchRcCustomPaths();
  const protectedPaths = torchRcConfig.protectedPaths;

  const defaultTargets = [
    ...new Set([...BUILD_DIRS, ...CACHE_DIRS, ...CUSTOM_DIRS]),
  ];
  const customTargets = [...new Set(torchRcCustomPaths)];

  // Filter out protected paths
  const filteredDefaultTargets = defaultTargets.filter(
    (target) =>
      !protectedPaths.some(
        (protectedPath) =>
          target === protectedPath || target.startsWith(protectedPath + "/"),
      ),
  );
  const filteredCustomTargets = customTargets.filter(
    (target) =>
      !protectedPaths.some(
        (protectedPath) =>
          target === protectedPath || target.startsWith(protectedPath + "/"),
      ),
  );

  const cleanupTarget = (target: string) => {
    if (fs.existsSync(target)) {
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
    }
  };

  outputToConsole(
    "Scanning for build artifacts and cache directories...",
    "step",
  );
  filteredDefaultTargets.forEach(cleanupTarget);

  if (filteredCustomTargets.length > 0) {
    outputToConsole(
      "Deleting user defined custom directories and files",
      "step",
    );
    filteredCustomTargets.forEach(cleanupTarget);
  }

  // Report protected paths
  const totalProtected =
    defaultTargets.length -
    filteredDefaultTargets.length +
    (customTargets.length - filteredCustomTargets.length);
  if (totalProtected > 0) {
    outputToConsole(
      `Skipped ${totalProtected} protected path(s) from torchrc.json`,
      "info",
    );
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
      outputToConsole(
        isDryRun ? "Dry-run: would clean npm cache" : "npm cache cleaned",
        "success",
      );
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
    outputToConsole(
      "No package manager caches cleaned (tools not available)",
      "info",
    );
  return cacheCleaned;
};

export { cleanupBuildsAndCaches, cleanupPackageManagerCaches };
