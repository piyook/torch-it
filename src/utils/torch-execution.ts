import { dockerCleanup, dockerRebuild, dockerLaunch } from "./docker";
import { outputToConsole, printRisingFromAshesBanner } from "./ui";
import { ICONS } from "../constants/constants";
import { cleanupBuildsAndCaches, cleanupPackageManagerCaches } from "./cleanup";
import { installDependencies } from "./dependency";
import type { TorchRecord } from "../types";
import { DEFAULT_TORCH_RC_CONFIG } from "../types";
import { statusMessage } from "./status";
import { renderTorchConfigDisplay } from "./config-display";
import { promptYesNo } from "./prompt";

async function confirmDestructiveRun(
  torchRcConfig: typeof DEFAULT_TORCH_RC_CONFIG,
): Promise<void> {
  // Never delete unprompted: without a terminal to ask on, --yes is required
  if (process.stdin.isTTY !== true) {
    outputToConsole(
      "No interactive terminal to confirm on. Re-run with --yes to skip the prompt, or --test for a dry run.",
      "fail",
    );
    process.exit(1);
  }

  outputToConsole(
    "\nReview the cleanup below. Matching paths and Docker actions (if enabled) will run next.",
    "warn",
  );
  renderTorchConfigDisplay(torchRcConfig, { includeHelpFooter: false });
  outputToConsole(
    "\nThese targets will be removed where they exist. Package caches may be cleared and dependencies reinstalled per your settings.",
    "warn",
  );
  const proceed = await promptYesNo("Continue? Type Yes or No (y/n): ");
  if (!proceed) {
    outputToConsole("Aborted.", "info");
    process.exit(0);
  }
}

function rebuildDocker(
  torchRcConfig: typeof DEFAULT_TORCH_RC_CONFIG,
  torchRecord: TorchRecord,
): void {
  if (torchRecord.dockerClean === "NO_DOCKER") {
    return;
  }

  if (torchRcConfig.rebuild === false) {
    outputToConsole("Rebuild disabled - skipping Docker rebuild", "info");
    return;
  }

  outputToConsole(`${ICONS.BUILD} DOCKER REBUILD`, "step");
  torchRecord.dockerRebuild = dockerRebuild(torchRcConfig);

  if (torchRecord.dockerRebuild) {
    outputToConsole(`${ICONS.ROCKET} LAUNCH`, "step");
    torchRecord.dockerLaunch = dockerLaunch(torchRcConfig);
  }
}

export async function executeTorchWorkflow(
  torchRcConfig: typeof DEFAULT_TORCH_RC_CONFIG,
  options: { assumeYes?: boolean } = {},
): Promise<TorchRecord> {
  const isDryRun = process.env.TORCH_DRY_RUN === "1";

  if (options.assumeYes !== true && !isDryRun) {
    await confirmDestructiveRun(torchRcConfig);
  }

  const torchRecord: TorchRecord = {
    dockerClean: "NO_DOCKER",
    buildAndCacheClean: false,
    packageManagerClean: false,
    dependencyInstall: false,
    dockerRebuild: false,
    dockerLaunch: false,
    logfile: torchRcConfig.logfile,
    rebuild: torchRcConfig.rebuild,
    dryRun: isDryRun,
  };

  // --- Docker Cleanup ---
  outputToConsole(`${ICONS.CLEAN} DOCKER CLEANUP`, "step");
  torchRecord.dockerClean = dockerCleanup(torchRcConfig);

  // --- Build/Cache Cleanup ---
  outputToConsole(`${ICONS.CLEAN} BUILD ARTIFACTS & CACHE CLEANUP`, "step");
  torchRecord.buildAndCacheClean = cleanupBuildsAndCaches(torchRcConfig);

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
  }

  // --- Docker Rebuild & Launch ---
  rebuildDocker(torchRcConfig, torchRecord);

  // --- Final Success Message ---
  statusMessage(torchRecord);

  return torchRecord;
}
