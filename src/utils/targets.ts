import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import type { TorchRcConfig } from "../types";
import { getCustomPaths, getProtectedPaths } from "./torchrc";
import { existingPaths } from "./cleanup-helpers";
import { listTrackedFiles } from "./git";

export type CleanupPlan = {
  // True when "only" narrows the run to the paths it lists
  onlyMode: boolean;
  defaultTargets: string[];
  filePatterns: string[];
  customTargets: string[];
};

export function getCleanupPlan(config: Required<TorchRcConfig>): CleanupPlan {
  if (config.only.length > 0) {
    return {
      onlyMode: true,
      defaultTargets: [],
      filePatterns: [],
      customTargets: [...new Set(config.only)],
    };
  }

  return {
    onlyMode: false,
    defaultTargets: [
      ...new Set<string>([...BUILD_DIRS, ...CACHE_DIRS, ...CUSTOM_DIRS]),
    ],
    filePatterns: [...FILE_PATTERNS],
    customTargets: getCustomPaths(config),
  };
}

// "dist/" and "dist\" name the same thing to git as "dist"
const toPathspec = (target: string): string => {
  const cleaned = target.replace(/\\/g, "/").replace(/\/+$/, "");
  return cleaned.includes("*") ? `:(glob)${cleaned}` : `:(literal)${cleaned}`;
};

export type RunProtection = {
  // What the user protected, plus the tracked files below
  protectedPaths: string[];
  // Files inside the targets that git tracks, kept unless allowTracked is on
  trackedFiles: string[];
};

// A file that is committed is somebody's work, not build output. Tracked files
// inside a target are protected like any other protected path.
export function getRunProtection(
  config: Required<TorchRcConfig>,
  plan: CleanupPlan,
): RunProtection {
  const protectedPaths = getProtectedPaths(config);
  if (config.allowTracked) {
    return { protectedPaths, trackedFiles: [] };
  }

  const trackedFiles = existingPaths(
    listTrackedFiles(
      [...plan.defaultTargets, ...plan.filePatterns, ...plan.customTargets].map(
        toPathspec,
      ),
    ),
  );
  return {
    protectedPaths: [...protectedPaths, ...trackedFiles],
    trackedFiles,
  };
}

// "build, tmp" - the top-level folders the tracked files sit in
export const describeTrackedLocations = (trackedFiles: string[]): string =>
  [...new Set(trackedFiles.map((file) => file.split("/")[0]))].join(", ");
