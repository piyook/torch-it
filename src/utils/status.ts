import { COLOURS, ICONS } from "../constants/constants";
import { printBox } from "./ui";
import type { TorchRecord } from "../types";

// True when a step that was meant to run did not succeed
const torchFailed = (torchRecord: TorchRecord): boolean => {
  const rebuild = torchRecord.rebuild !== false;

  if (rebuild && !torchRecord.dependencyInstall) return true;
  if (torchRecord.dockerClean === "DOCKER_FAIL") return true;

  return (
    torchRecord.dockerClean === "OK" &&
    rebuild &&
    !(torchRecord.dockerRebuild && torchRecord.dockerLaunch)
  );
};

const dependencyLine = (torchRecord: TorchRecord): string => {
  if (torchRecord.rebuild === false) {
    return `${ICONS.BOX} Dependency install skipped (rebuild disabled)`;
  }
  return torchRecord.dependencyInstall
    ? `${ICONS.BOX} Dependencies freshly installed`
    : `${ICONS.FAIL} Failed to install dependencies`;
};

const dockerLines = (torchRecord: TorchRecord): string[] => {
  if (torchRecord.dockerClean === "NO_DOCKER") {
    return [`${ICONS.DOCKER} Docker steps skipped`];
  }
  if (torchRecord.dockerClean === "DOCKER_FAIL") {
    return [`${ICONS.FAIL} Failed to remove Docker containers`];
  }

  const removed = `${ICONS.DOCKER} Docker containers, images and volumes removed`;
  if (torchRecord.rebuild === false) {
    return [
      removed,
      `${ICONS.DOCKER} Docker rebuild skipped (rebuild disabled)`,
    ];
  }

  return [
    removed,
    torchRecord.dockerRebuild
      ? `${ICONS.DOCKER} Docker containers rebuilt from scratch`
      : `${ICONS.FAIL} Failed to rebuild Docker containers`,
    torchRecord.dockerLaunch && torchRecord.dockerRebuild
      ? `${ICONS.ROCKET} Services running in detached mode`
      : `${ICONS.FAIL} Failed to start Docker containers`,
  ];
};

const titleLine = (torchRecord: TorchRecord, failed: boolean): string => {
  if (failed) return `${ICONS.FAIL} TORCHED WITH ERRORS - SEE OUTPUT ABOVE`;
  if (torchRecord.dryRun) return "🔥 DRY RUN COMPLETE - NOTHING WAS CHANGED 🔥";
  return "🔥 PROJECT SUCCESSFULLY TORCHED! 🔥";
};

const statusMessage = (torchRecord: TorchRecord) => {
  const failed = torchFailed(torchRecord);

  const buildAndCache = torchRecord.buildAndCacheClean
    ? `${ICONS.CLEAN} All build artifacts & caches removed`
    : `${ICONS.STARS} No build artifacts found (already clean)`;

  const packageManagerCache = torchRecord.packageManagerClean
    ? `${ICONS.CLEAN} Package manager cache cleaned`
    : `${ICONS.WARN} Package manager cache not cleaned`;

  console.log("");
  printBox(
    [
      titleLine(torchRecord, failed),
      "",
      buildAndCache,
      packageManagerCache,
      dependencyLine(torchRecord),
      ...dockerLines(torchRecord),
      "",
      torchRecord.logfile === false
        ? `${ICONS.CLIPBOARD} Logging to torch-it.log is disabled; set "logfile": true in torchrc.json to enable it`
        : `${ICONS.CLIPBOARD} Check torch-it.log for detailed logs`,
    ],
    failed ? COLOURS.RED : COLOURS.GREEN,
  );
};

export { statusMessage, torchFailed };
