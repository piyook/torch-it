import { dockerCleanup, dockerRebuild, dockerLaunch } from "./utils/docker";
import { printBanner, outputToConsole } from "./utils/ui";
import { ICONS } from "./constants/constants";
import {
  cleanupBuildsAndCaches,
  cleanupPackageManagerCaches,
} from "./utils/cleanup";
import { clearLog } from "./utils/logger";
import { installDependencies } from "./utils/dependency";
import type { NukeRecord } from "./types";
import { statusMessage } from "./utils/status";

// --- Initialisation ---
const cliArgs = process.argv.slice(2);
const isDryRun = cliArgs.includes("--test");
if (isDryRun) {
  process.env.NUKE_DRY_RUN = "1";
}

clearLog();
printBanner();
if (isDryRun) {
  outputToConsole("Running in --test dry-run mode (no files or services will be changed)", "warn");
}

const nukeRecord: NukeRecord = {
  dockerClean: "NO_DOCKER",
  buildAndCacheClean: false,
  packageManagerClean: false,
  dependencyInstall: false,
  dockerRebuild: false,
  dockerLaunch: false,
};

// --- Docker Cleanup ---
outputToConsole(`${ICONS.CLEAN} DOCKER CLEANUP`, "step");
nukeRecord.dockerClean = dockerCleanup();

// --- Build/Cache Cleanup ---
outputToConsole(`${ICONS.CLEAN} BUILD ARTIFACTS & CACHE CLEANUP`, "step");
nukeRecord.buildAndCacheClean = cleanupBuildsAndCaches();

// --- Package Manager Cache Cleanup ---
outputToConsole("Cleaning package manager caches...", "step");
nukeRecord.packageManagerClean = cleanupPackageManagerCaches();

// --- Dependency Installation ---
outputToConsole(`${ICONS.BUILD} DEPENDENCY INSTALLATION`, "step");
nukeRecord.dependencyInstall = installDependencies();

// --- Docker Rebuild ---
if (nukeRecord.dockerClean) {
  outputToConsole(`${ICONS.BUILD} DOCKER REBUILD`, "step");
  nukeRecord.dockerRebuild = dockerRebuild();
}

// --- Docker Launch ---
if (nukeRecord.dockerRebuild) {
  nukeRecord.dockerLaunch = dockerLaunch();
  outputToConsole(`${ICONS.ROCKET} LAUNCH`, "step");
}

// --- Final Success Message ---
statusMessage(nukeRecord);

console.log({ nukeRecord });
