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
import { showHelp } from "./utils/help";

// --- Initialisation ---
const cliArgs = process.argv.slice(2);

// Check for --help flag
if (cliArgs.includes("--help")) {
  showHelp();
  process.exit(0);
}

const isDryRun = cliArgs.includes("--test");
if (isDryRun) {
  process.env.TORCH_DRY_RUN = "1";
}

const torchRcConfig = getTorchRcConfig(
  cliArgs.filter((arg) => arg !== "--test" && arg !== "--help"),
);
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
