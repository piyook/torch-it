export type TorchRecord = {
  dockerClean: "NO_DOCKER" | "DOCKER_FAIL" | "OK";
  buildAndCacheClean: boolean;
  packageManagerClean: boolean;
  dependencyInstall: boolean;
  dockerRebuild: boolean;
  dockerLaunch: boolean;
  logfile?: boolean;
};

export type TorchRcConfig = {
  customPaths?: string[];
  customDirs?: string[];
  customFiles?: string[];
  protectedPaths?: string[];
  dockerMode?: boolean;
  logfile?: boolean;
  rebuild?: boolean;
};

export const DEFAULT_TORCH_RC_CONFIG: Required<TorchRcConfig> = {
  customPaths: [],
  customDirs: [],
  customFiles: [],
  protectedPaths: [],
  dockerMode: true,
  logfile: true,
  rebuild: true,
};
