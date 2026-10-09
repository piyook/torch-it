export type TorchRecord = {
  dockerClean: "NO_DOCKER" | "DOCKER_UNAVAILABLE" | "DOCKER_FAIL" | "OK";
  buildAndCacheClean: boolean;
  packageManagerClean: boolean;
  dependencyInstall: boolean;
  dockerRebuild: boolean;
  dockerLaunch: boolean;
  logfile?: boolean;
  rebuild?: boolean;
  dryRun?: boolean;
  cleanupFailures?: number;
  cacheClean?: boolean;
  dockerVolumes?: boolean;
  trackedKept?: number;
  packageManager?: string | null;
  // The paths behind the counts above, for the --json result
  paths?: CleanupPaths;
};

export type CleanupPaths = {
  removed: string[];
  failed: string[];
  tracked: string[];
};

export type TorchRcConfig = {
  customPaths?: string[];
  customDirs?: string[];
  customFiles?: string[];
  protectedPaths?: string[];
  only?: string[];
  dockerMode?: boolean;
  dockerVolumes?: boolean;
  logfile?: boolean;
  rebuild?: boolean;
  cacheClean?: boolean;
  allowTracked?: boolean;
};

export const DEFAULT_TORCH_RC_CONFIG: Required<TorchRcConfig> = {
  customPaths: [],
  customDirs: [],
  customFiles: [],
  protectedPaths: [],
  only: [],
  dockerMode: false,
  dockerVolumes: false,
  logfile: false,
  rebuild: true,
  cacheClean: true,
  allowTracked: false,
};
