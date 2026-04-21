import { dockerCleanup, dockerRebuild, dockerLaunch } from "./docker";
import { outputToConsole, printRisingFromAshesBanner } from "./ui";
import { ICONS } from "../constants/constants";
import { cleanupBuildsAndCaches, cleanupPackageManagerCaches } from "./cleanup";
import { installDependencies } from "./dependency";
import type { TorchRecord } from "../types";
import { DEFAULT_TORCH_RC_CONFIG } from "../types";
import { statusMessage } from "./status";

export function executeTorchWorkflow(
  torchRcConfig: typeof DEFAULT_TORCH_RC_CONFIG,
): TorchRecord {
  const torchRecord: TorchRecord = {
    dockerClean: "NO_DOCKER",
    buildAndCacheClean: false,
    packageManagerClean: false,
    dependencyInstall: false,
    dockerRebuild: false,
    dockerLaunch: false,
    logfile: torchRcConfig.logfile,
  };

  // --- Docker Cleanup ---
  outputToConsole(`${ICONS.CLEAN} DOCKER CLEANUP`, "step");
  torchRecord.dockerClean = dockerCleanup();

  // --- Build/Cache Cleanup ---
  outputToConsole(`${ICONS.CLEAN} BUILD ARTIFACTS & CACHE CLEANUP`, "step");
  torchRecord.buildAndCacheClean = cleanupBuildsAndCaches();

  // --- Package Manager Cache Cleanup ---
  outputToConsole("Cleaning package manager caches...", "step");
  torchRecord.packageManagerClean = cleanupPackageManagerCaches();

  // --- Dependency Installation ---
  if (torchRcConfig.rebuild !== false) {
    printRisingFromAshesBanner();
    outputToConsole(`${ICONS.BUILD} DEPENDENCY INSTALLATION`, "step");
    torchRecord.dependencyInstall = installDependencies();
  } else {
    outputToConsole(
      "Rebuild disabled - skipping dependency installation",
      "info",
    );
    torchRecord.dependencyInstall = false;
  }

  // --- Docker Rebuild ---
  if (
    torchRecord.dockerClean !== "NO_DOCKER" &&
    torchRcConfig.rebuild !== false
  ) {
    outputToConsole(`${ICONS.BUILD} DOCKER REBUILD`, "step");
    torchRecord.dockerRebuild = dockerRebuild();
  } else if (
    torchRecord.dockerClean !== "NO_DOCKER" &&
    torchRcConfig.rebuild === false
  ) {
    outputToConsole("Rebuild disabled - skipping Docker rebuild", "info");
    torchRecord.dockerRebuild = false;
  }

  // --- Docker Launch ---
  if (torchRecord.dockerRebuild) {
    torchRecord.dockerLaunch = dockerLaunch();
    outputToConsole(`${ICONS.ROCKET} LAUNCH`, "step");
  }

  // --- Final Success Message ---
  statusMessage(torchRecord);

  return torchRecord;
}
