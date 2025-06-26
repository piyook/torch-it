import { dockerCleanup, dockerRebuild, dockerLaunch } from "./utils/docker";
import { printBanner, printBox, outputToConsole } from "./utils/ui";
import { ICONS } from "./constants/constants";
import {
  cleanupBuildsAndCaches,
  cleanupPackageManagerCaches,
} from "./utils/cleanup";
import { clearLog } from "./utils/logger";
import { installDependencies } from "./utils/dependency";

// --- Initialisation ---

clearLog();
printBanner();

// --- Docker Cleanup ---
outputToConsole(`${ICONS.CLEAN} DOCKER CLEANUP`, "step");
dockerCleanup();

// --- Build/Cache Cleanup ---
outputToConsole(`${ICONS.CLEAN} BUILD ARTIFACTS & CACHE CLEANUP`, "step");
cleanupBuildsAndCaches();

// --- Package Manager Cache Cleanup ---
outputToConsole("Cleaning package manager caches...", "step");
cleanupPackageManagerCaches();

// --- Dependency Installation ---
outputToConsole(`${ICONS.BUILD} DEPENDENCY INSTALLATION`, "step");
installDependencies();

// --- Docker Rebuild ---
outputToConsole(`${ICONS.BUILD} DOCKER REBUILD`, "step");
dockerRebuild();

// --- Docker Launch ---
outputToConsole(`${ICONS.ROCKET} LAUNCH`, "step");
dockerLaunch();

// --- Final Success Message ---
printBox([
  "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
  "",
  "✨ All build artifacts & caches removed",
  "🐳 Docker containers rebuilt from scratch",
  "📦 Dependencies freshly installed",
  "🚀 Services running in detached mode",
  "",
  "📋 Check nuke-it.log for detailed logs",
]);
