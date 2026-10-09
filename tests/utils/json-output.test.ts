import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import type { TorchRecord } from "../../src/types";
import {
  buildRunResult,
  exitWithError,
  isJsonMode,
  printJson,
  recordProblem,
  setJsonMode,
} from "../../src/utils/json-output";

const successRecord: TorchRecord = {
  dockerClean: "NO_DOCKER",
  buildAndCacheClean: true,
  packageManagerClean: true,
  dependencyInstall: true,
  dockerRebuild: false,
  dockerLaunch: false,
  packageManager: "npm",
  paths: { removed: ["dist"], failed: [], tracked: ["build/app.js"] },
};

describe("json output", () => {
  let stdout: MockInstance;
  let exit: MockInstance;

  const printed = () => JSON.parse(String(stdout.mock.calls[0][0]));

  beforeEach(() => {
    stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    setJsonMode(false);
    stdout.mockRestore();
    exit.mockRestore();
  });

  it("is off until asked for", () => {
    expect(isJsonMode()).toBe(false);
    setJsonMode(true);
    expect(isJsonMode()).toBe(true);
  });

  it("prints a value as one JSON document ending in a newline", () => {
    printJson({ a: 1 });

    expect(String(stdout.mock.calls[0][0]).endsWith("}\n")).toBe(true);
    expect(printed()).toEqual({ a: 1 });
  });

  describe("buildRunResult", () => {
    it("describes a successful run", () => {
      expect(buildRunResult(successRecord, 0)).toMatchObject({
        ok: true,
        exitCode: 0,
        dryRun: false,
        changed: true,
        cwd: process.cwd(),
        packageManager: "npm",
        removed: ["dist"],
        failed: [],
        keptTracked: ["build/app.js"],
        steps: {
          dockerTeardown: "skipped",
          cleanup: "ok",
          cacheClean: "ok",
          install: "ok",
          dockerRebuild: "skipped",
          dockerStart: "skipped",
        },
      });
      expect(buildRunResult(successRecord, 0).version).toMatch(
        /^\d+\.\d+\.\d+/,
      );
    });

    it("marks a dry run as having changed nothing", () => {
      expect(
        buildRunResult({ ...successRecord, dryRun: true }, 0),
      ).toMatchObject({ dryRun: true, changed: false, removed: ["dist"] });
    });

    it("reports skipped and failed steps", () => {
      const result = buildRunResult(
        {
          ...successRecord,
          cacheClean: false,
          dependencyInstall: false,
          cleanupFailures: 1,
          paths: { removed: [], failed: ["node_modules"], tracked: [] },
        },
        2,
      );

      expect(result).toMatchObject({
        ok: false,
        exitCode: 2,
        failed: ["node_modules"],
        steps: { cleanup: "failed", cacheClean: "skipped", install: "failed" },
      });
    });

    it("reports install as skipped when rebuild is off", () => {
      const result = buildRunResult(
        { ...successRecord, rebuild: false, dependencyInstall: false },
        0,
      );

      expect(result.steps.install).toBe("skipped");
    });

    it.each<[string, Partial<TorchRecord>, Record<string, string>]>([
      [
        "a full docker run",
        { dockerClean: "OK", dockerRebuild: true, dockerLaunch: true },
        { dockerTeardown: "ok", dockerRebuild: "ok", dockerStart: "ok" },
      ],
      [
        "docker unavailable",
        { dockerClean: "DOCKER_UNAVAILABLE" },
        {
          dockerTeardown: "unavailable",
          dockerRebuild: "skipped",
          dockerStart: "skipped",
        },
      ],
      [
        "a failed rebuild",
        { dockerClean: "OK", dockerRebuild: false },
        {
          dockerTeardown: "ok",
          dockerRebuild: "failed",
          dockerStart: "skipped",
        },
      ],
      [
        "a failed start",
        { dockerClean: "OK", dockerRebuild: true, dockerLaunch: false },
        { dockerTeardown: "ok", dockerRebuild: "ok", dockerStart: "failed" },
      ],
      [
        "docker with rebuild off",
        { dockerClean: "OK", rebuild: false },
        {
          dockerTeardown: "ok",
          dockerRebuild: "skipped",
          dockerStart: "skipped",
        },
      ],
    ])("reports the docker steps for %s", (_name, record, steps) => {
      expect(
        buildRunResult({ ...successRecord, ...record }, 0).steps,
      ).toMatchObject(steps);
    });

    it("falls back to empty lists and no package manager", () => {
      const { paths: _paths, packageManager: _pm, ...bare } = successRecord;

      expect(buildRunResult(bare, 0)).toMatchObject({
        packageManager: null,
        removed: [],
        failed: [],
        keptTracked: [],
      });
    });
  });

  describe("exitWithError", () => {
    it("exits with 1 and prints nothing in normal mode", () => {
      exitWithError();

      expect(exit).toHaveBeenCalledWith(1);
      expect(stdout).not.toHaveBeenCalled();
    });

    it("prints the recorded problems as JSON in JSON mode", () => {
      setJsonMode(true);
      recordProblem("fail", "Unknown option --nope");
      recordProblem("warn", "something to look at");
      recordProblem("info", "not a problem");

      exitWithError();

      expect(exit).toHaveBeenCalledWith(1);
      expect(printed()).toMatchObject({
        ok: false,
        exitCode: 1,
        changed: false,
        errors: expect.arrayContaining(["Unknown option --nope"]),
        warnings: expect.arrayContaining(["something to look at"]),
      });
      expect(printed().errors).not.toContain("not a problem");
    });
  });
});
