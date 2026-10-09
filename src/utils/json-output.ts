import { EXIT } from "../constants/constants";
import type { TorchRecord } from "../types";
import { getVersion } from "./version";

// With --json, stdout carries one JSON document and nothing else
let jsonMode = false;
const warnings: string[] = [];
const errors: string[] = [];

export const setJsonMode = (enabled: boolean): void => {
  jsonMode = enabled;
};

export const isJsonMode = (): boolean => jsonMode;

// Every warning and error line is kept so the JSON result can carry them
export function recordProblem(type: string, message: string): void {
  if (type === "warn") warnings.push(message);
  if (type === "fail") errors.push(message);
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

// For the exits where nothing was changed: bad options, wrong directory, no way to confirm
export function exitWithError(): never {
  if (jsonMode) {
    printJson({
      version: getVersion(),
      ok: false,
      exitCode: EXIT.ERROR,
      changed: false,
      warnings,
      errors,
    });
  }
  process.exit(EXIT.ERROR);
}

type StepStatus = "ok" | "failed" | "skipped" | "unavailable";

const DOCKER_TEARDOWN: Record<TorchRecord["dockerClean"], StepStatus> = {
  NO_DOCKER: "skipped",
  DOCKER_UNAVAILABLE: "unavailable",
  DOCKER_FAIL: "failed",
  OK: "ok",
};

const okOrFailed = (succeeded: boolean): StepStatus =>
  succeeded ? "ok" : "failed";

function dockerSteps(torchRecord: TorchRecord) {
  const dockerTeardown = DOCKER_TEARDOWN[torchRecord.dockerClean];
  const rebuilds =
    torchRecord.rebuild !== false &&
    (dockerTeardown === "ok" || dockerTeardown === "failed");

  return {
    dockerTeardown,
    dockerRebuild: rebuilds ? okOrFailed(torchRecord.dockerRebuild) : "skipped",
    dockerStart:
      rebuilds && torchRecord.dockerRebuild
        ? okOrFailed(torchRecord.dockerLaunch)
        : "skipped",
  };
}

// In a dry run "ok" means the step would run, and "removed" lists what would go
export function buildRunResult(torchRecord: TorchRecord, exitCode: number) {
  const docker = dockerSteps(torchRecord);

  return {
    version: getVersion(),
    ok: exitCode === EXIT.OK,
    exitCode,
    dryRun: torchRecord.dryRun === true,
    changed: torchRecord.dryRun !== true,
    cwd: process.cwd(),
    packageManager: torchRecord.packageManager ?? null,
    removed: torchRecord.paths?.removed ?? [],
    failed: torchRecord.paths?.failed ?? [],
    keptTracked: torchRecord.paths?.tracked ?? [],
    steps: {
      dockerTeardown: docker.dockerTeardown,
      cleanup: okOrFailed((torchRecord.cleanupFailures ?? 0) === 0),
      cacheClean:
        torchRecord.cacheClean === false
          ? "skipped"
          : okOrFailed(torchRecord.packageManagerClean),
      install:
        torchRecord.rebuild === false
          ? "skipped"
          : okOrFailed(torchRecord.dependencyInstall),
      dockerRebuild: docker.dockerRebuild,
      dockerStart: docker.dockerStart,
    },
    warnings,
    errors,
  };
}
