import { COLOURS, ICONS } from "../constants/constants";
import { printBox } from "./ui";
import type { TorchRecord } from "../types";

// A dry run did none of it, so its summary must not say that it did
const DRY_RUN_WORDING: Record<string, string> = {
  removed: "would be removed",
  cleaned: "would be cleaned",
  "freshly installed": "would be installed",
  "rebuilt from scratch": "would be rebuilt",
  "running in detached mode": "would be started",
};

const done = (torchRecord: TorchRecord, wording: string): string =>
  torchRecord.dryRun ? DRY_RUN_WORDING[wording] : wording;

const cleanupFailures = (torchRecord: TorchRecord): number =>
  torchRecord.cleanupFailures ?? 0;

const dockerFailed = (torchRecord: TorchRecord, rebuild: boolean): boolean => {
  if (
    torchRecord.dockerClean === "DOCKER_FAIL" ||
    torchRecord.dockerClean === "DOCKER_UNAVAILABLE"
  ) {
    return true;
  }

  return (
    torchRecord.dockerClean === "OK" &&
    rebuild &&
    !(torchRecord.dockerRebuild && torchRecord.dockerLaunch)
  );
};

// True when a step that was meant to run did not succeed
const torchFailed = (torchRecord: TorchRecord): boolean => {
  const rebuild = torchRecord.rebuild !== false;

  if (cleanupFailures(torchRecord) > 0) return true;
  if (rebuild && !torchRecord.dependencyInstall) return true;

  return dockerFailed(torchRecord, rebuild);
};

const buildAndCacheLines = (torchRecord: TorchRecord): string[] => {
  const failures = cleanupFailures(torchRecord);
  if (failures > 0) {
    return [
      `${ICONS.FAIL} ${failures} path(s) could not be removed (in use or locked?)`,
    ];
  }
  return [
    torchRecord.buildAndCacheClean
      ? `${ICONS.CLEAN} All build artifacts & caches ${done(torchRecord, "removed")}`
      : `${ICONS.STARS} No build artifacts found (already clean)`,
  ];
};

const cacheLine = (torchRecord: TorchRecord): string => {
  if (torchRecord.cacheClean === false) {
    return `${ICONS.CLEAN} Package manager cache left alone (cacheClean disabled)`;
  }
  return torchRecord.packageManagerClean
    ? `${ICONS.CLEAN} Package manager cache ${done(torchRecord, "cleaned")}`
    : `${ICONS.WARN} Package manager cache not cleaned`;
};

const dependencyLine = (torchRecord: TorchRecord): string => {
  if (torchRecord.rebuild === false) {
    return `${ICONS.BOX} Dependency install skipped (rebuild disabled)`;
  }
  return torchRecord.dependencyInstall
    ? `${ICONS.BOX} Dependencies ${done(torchRecord, "freshly installed")}`
    : `${ICONS.FAIL} Failed to install dependencies`;
};

const dockerLines = (torchRecord: TorchRecord): string[] => {
  if (torchRecord.dockerClean === "NO_DOCKER") {
    return [`${ICONS.DOCKER} Docker steps skipped`];
  }
  if (torchRecord.dockerClean === "DOCKER_UNAVAILABLE") {
    return [`${ICONS.FAIL} Docker is not available - Docker steps did not run`];
  }
  if (torchRecord.dockerClean === "DOCKER_FAIL") {
    return [`${ICONS.FAIL} Failed to remove Docker containers`];
  }

  const removed = `${ICONS.DOCKER} Docker containers${torchRecord.dockerVolumes ? ", images and volumes" : " and images"} ${done(torchRecord, "removed")}`;
  if (torchRecord.rebuild === false) {
    return [
      removed,
      `${ICONS.DOCKER} Docker rebuild skipped (rebuild disabled)`,
    ];
  }

  return [
    removed,
    torchRecord.dockerRebuild
      ? `${ICONS.DOCKER} Docker containers ${done(torchRecord, "rebuilt from scratch")}`
      : `${ICONS.FAIL} Failed to rebuild Docker containers`,
    torchRecord.dockerLaunch && torchRecord.dockerRebuild
      ? `${ICONS.ROCKET} Services ${done(torchRecord, "running in detached mode")}`
      : `${ICONS.FAIL} Failed to start Docker containers`,
  ];
};

const titleLine = (torchRecord: TorchRecord, failed: boolean): string => {
  if (failed && torchRecord.dryRun) {
    return `${ICONS.FAIL} DRY RUN FOUND PROBLEMS - NOTHING WAS CHANGED`;
  }
  if (failed) return `${ICONS.FAIL} TORCHED WITH ERRORS - SEE OUTPUT ABOVE`;
  if (torchRecord.dryRun) return "🔥 DRY RUN COMPLETE - NOTHING WAS CHANGED 🔥";
  return "🔥 PROJECT SUCCESSFULLY TORCHED! 🔥";
};

const statusMessage = (torchRecord: TorchRecord) => {
  const failed = torchFailed(torchRecord);

  const packageManagerCache = cacheLine(torchRecord);

  printBox(
    [
      titleLine(torchRecord, failed),
      "",
      ...buildAndCacheLines(torchRecord),
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
