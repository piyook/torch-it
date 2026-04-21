import { outputToConsole } from "./ui";
import * as fs from "fs";
import * as path from "path";
import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import { hasCmd, run } from "./system";
import type { TorchRcConfig } from "../types";
import { DEFAULT_TORCH_RC_CONFIG } from "../types";

const parseCliOverrides = (cliArgs: string[]): Partial<TorchRcConfig> => {
  const overrides: Partial<TorchRcConfig> = {};

  for (const arg of cliArgs) {
    if (!arg.startsWith("--")) continue;

    const [key, value] = arg.slice(2).split("=", 2);
    if (!key || !value) continue;

    try {
      // Try to parse as JSON first (for arrays/objects)
      const parsedValue = JSON.parse(value);
      (overrides as any)[key] = parsedValue;
    } catch {
      // If not JSON, treat as string or boolean
      if (value === "true") {
        (overrides as any)[key] = true;
      } else if (value === "false") {
        (overrides as any)[key] = false;
      } else {
        (overrides as any)[key] = value;
      }
    }
  }

  return overrides;
};

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

export const getTorchRcConfigFromFile = (): Required<TorchRcConfig> => {
  const userConfig = loadTorchRcConfig();
  return {
    customPaths: userConfig.customPaths ?? DEFAULT_TORCH_RC_CONFIG.customPaths,
    customDirs: userConfig.customDirs ?? DEFAULT_TORCH_RC_CONFIG.customDirs,
    customFiles: userConfig.customFiles ?? DEFAULT_TORCH_RC_CONFIG.customFiles,
    protectedPaths:
      userConfig.protectedPaths ?? DEFAULT_TORCH_RC_CONFIG.protectedPaths,
    dockerMode: userConfig.dockerMode ?? DEFAULT_TORCH_RC_CONFIG.dockerMode,
    logfile: userConfig.logfile ?? DEFAULT_TORCH_RC_CONFIG.logfile,
    rebuild: userConfig.rebuild ?? DEFAULT_TORCH_RC_CONFIG.rebuild,
  };
};

export { loadTorchRcCustomPaths };

export const getTorchRcConfig = (
  cliArgs: string[] = [],
): Required<TorchRcConfig> => {
  const fileConfig = getTorchRcConfigFromFile();
  const cliOverrides = parseCliOverrides(cliArgs);

  // CLI overrides take precedence over file config
  return { ...fileConfig, ...cliOverrides };
};

const loadTorchRcCustomPaths = (): string[] => {
  const config = getTorchRcConfigFromFile();

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
  const torchRcConfig = getTorchRcConfigFromFile();
  const torchRcCustomPaths = loadTorchRcCustomPaths();
  const protectedPaths = torchRcConfig.protectedPaths;

  const defaultTargets = [
    ...new Set([...BUILD_DIRS, ...CACHE_DIRS, ...CUSTOM_DIRS]),
  ];
  const customTargets = [...new Set(torchRcCustomPaths)];
  const filePatterns = [...FILE_PATTERNS];

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

  const cleanupFilePatterns = () => {
    for (const pattern of filePatterns) {
      const isGlob = pattern.includes("*");
      if (isGlob) {
        try {
          const files = fs
            .readdirSync(".", { withFileTypes: true })
            .filter((dirent) => {
              const name = dirent.name;
              return name.match(pattern.replace("*", ".*"));
            })
            .map((dirent) => dirent.name);

          for (const file of files) {
            const filePath = path.join(".", file);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              // Check if file is protected
              const isProtected = protectedPaths.some(
                (protectedPath) =>
                  filePath === protectedPath ||
                  filePath.startsWith(protectedPath + "/"),
              );

              if (!isProtected) {
                outputToConsole(
                  `${isDryRun ? "Would remove" : "Removing"} ${filePath}...`,
                  "step",
                );
                try {
                  if (!isDryRun) {
                    fs.unlinkSync(filePath);
                  }
                  outputToConsole(
                    `${filePath} ${isDryRun ? "marked for removal (dry-run)" : "removed"}`,
                    "success",
                  );
                  removedCount++;
                } catch {
                  outputToConsole(`Failed to remove ${filePath}`, "fail");
                }
              }
            }
          }
        } catch (error) {
          outputToConsole(
            `Failed to process pattern ${pattern}: ${error}`,
            "warn",
          );
        }
      } else {
        // Handle non-glob patterns (like tsconfig.tsbuildinfo)
        if (fs.existsSync(pattern)) {
          cleanupTarget(pattern);
        }
      }
    }
  };

  outputToConsole(
    "Scanning for build artifacts and cache directories...",
    "step",
  );
  filteredDefaultTargets.forEach(cleanupTarget);

  outputToConsole("Scanning for log files and temporary files...", "step");
  cleanupFilePatterns();

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
