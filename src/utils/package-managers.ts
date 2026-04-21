import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";

export type PackageManager = "npm" | "yarn" | "pnpm";

export interface PackageManagerConfig {
  name: PackageManager;
  lockFile: string;
  installCommand: string;
  cacheCleanCommand: string;
}

const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerConfig> = {
  npm: {
    name: "npm",
    lockFile: "package-lock.json",
    installCommand: "npm install",
    cacheCleanCommand: "npm cache clean --force",
  },
  yarn: {
    name: "yarn",
    lockFile: "yarn.lock",
    installCommand: "yarn install",
    cacheCleanCommand: "yarn cache clean",
  },
  pnpm: {
    name: "pnpm",
    lockFile: "pnpm-lock.yaml",
    installCommand: "pnpm install",
    cacheCleanCommand: "pnpm store prune",
  },
};

export function detectPackageManager(): PackageManager | null {
  for (const pm of ["pnpm", "yarn", "npm"] as PackageManager[]) {
    if (fs.existsSync(PACKAGE_MANAGERS[pm].lockFile) && hasCmd(pm)) {
      return pm;
    }
  }

  for (const pm of ["npm", "yarn", "pnpm"] as PackageManager[]) {
    if (hasCmd(pm)) {
      return pm;
    }
  }

  return null;
}

export function installWithPackageManager(pm: PackageManager): boolean {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  const config = PACKAGE_MANAGERS[pm];

  const detectionMessage =
    pm === detectPackageManager()
      ? `Using ${pm} (detected ${config.lockFile})...`
      : `Using ${pm} (fallback)...`;

  outputToConsole(detectionMessage, "step");

  if (isDryRun || run(config.installCommand)) {
    outputToConsole(
      `Dependencies ${isDryRun ? "would be installed" : "installed successfully"} with ${pm}`,
      "success",
    );
    return true;
  }

  outputToConsole(`${pm} install failed`, "fail");
  return false;
}

export function cleanPackageManagerCache(pm: PackageManager): boolean {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  const config = PACKAGE_MANAGERS[pm];

  if (isDryRun || run(config.cacheCleanCommand)) {
    outputToConsole(
      isDryRun ? `Dry-run: would clean ${pm} cache` : `${pm} cache cleaned`,
      "success",
    );
    return true;
  }

  return false;
}

export function getAvailablePackageManagers(): PackageManager[] {
  return (Object.keys(PACKAGE_MANAGERS) as PackageManager[]).filter(hasCmd);
}
