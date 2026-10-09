import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
  FILE_PATTERNS,
} from "../constants/config";
import type { TorchRcConfig } from "../types";
import { getCustomPaths } from "./torchrc";

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
