import { dockerCleanup, dockerRebuild, dockerLaunch } from "./utils/docker";
import {
  printBanner,
  outputToConsole,
  printRisingFromAshesBanner,
} from "./utils/ui";
import { ICONS } from "./constants/constants";
import {
  cleanupBuildsAndCaches,
  cleanupPackageManagerCaches,
} from "./utils/cleanup";
import { clearLog, setLoggerEnabled } from "./utils/logger";
import { installDependencies } from "./utils/dependency";
import type { TorchRecord } from "./types";
import { getTorchRcConfig } from "./utils/cleanup";
import { statusMessage } from "./utils/status";

// --- Initialisation ---
const cliArgs = process.argv.slice(2);
const isDryRun = cliArgs.includes("--test");
if (isDryRun) {
  process.env.TORCH_DRY_RUN = "1";
}

const torchRcConfig = getTorchRcConfig();
setLoggerEnabled(torchRcConfig.logfile);
if (torchRcConfig.logfile) {
  clearLog();
}
printBanner();
if (isDryRun) {
  outputToConsole(
    "Running in --test dry-run mode (no files or services will be changed)",
    "warn",
  );
}

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
printRisingFromAshesBanner();
outputToConsole(`${ICONS.BUILD} DEPENDENCY INSTALLATION`, "step");
torchRecord.dependencyInstall = installDependencies();

// --- Docker Rebuild ---
if (torchRecord.dockerClean) {
  outputToConsole(`${ICONS.BUILD} DOCKER REBUILD`, "step");
  torchRecord.dockerRebuild = dockerRebuild();
}

// --- Docker Launch ---
if (torchRecord.dockerRebuild) {
  torchRecord.dockerLaunch = dockerLaunch();
  outputToConsole(`${ICONS.ROCKET} LAUNCH`, "step");
}

// --- Final Success Message ---
statusMessage(torchRecord);
