export type TorchRecord = {
  dockerClean: "NO_DOCKER" | "DOCKER_FAIL" | "OK";
  buildAndCacheClean: boolean;
  packageManagerClean: boolean;
  dependencyInstall: boolean;
  dockerRebuild: boolean;
  dockerLaunch: boolean;
};
