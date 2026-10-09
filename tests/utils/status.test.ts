import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TorchRecord } from "../../src/types";

vi.mock("../../src/utils/ui", () => ({
  printBox: vi.fn(),
}));

import { statusMessage, torchFailed } from "../../src/utils/status";
import { printBox } from "../../src/utils/ui";

const mockedPrintBox = vi.mocked(printBox);

const successRecord: TorchRecord = {
  dockerClean: "NO_DOCKER",
  buildAndCacheClean: true,
  packageManagerClean: true,
  dependencyInstall: true,
  dockerRebuild: false,
  dockerLaunch: false,
};

const dockerSuccessRecord: TorchRecord = {
  ...successRecord,
  dockerClean: "OK",
  dockerRebuild: true,
  dockerLaunch: true,
};

const linesFor = (record: TorchRecord): string[] => {
  statusMessage(record);
  return mockedPrintBox.mock.calls[0][0];
};

describe("statusMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prints a success summary when docker steps are skipped", () => {
    const lines = linesFor(successRecord);

    expect(mockedPrintBox).toHaveBeenCalledTimes(1);
    expect(lines[0]).toBe("🔥 PROJECT SUCCESSFULLY TORCHED! 🔥");
    expect(lines).toContain("🔥 All build artifacts & caches removed");
    expect(lines).toContain("📦 Dependencies freshly installed");
    expect(lines).toContain("🐳 Docker steps skipped");
  });

  it("prints docker rebuild and launch success messages when docker flow succeeds", () => {
    const lines = linesFor(dockerSuccessRecord);

    expect(lines).toContain("🐳 Docker containers rebuilt from scratch");
    expect(lines).toContain("🔥 Services running in detached mode");
  });

  it("does not report skipped steps as failures when rebuild is disabled", () => {
    const lines = linesFor({
      ...successRecord,
      dockerClean: "OK",
      dependencyInstall: false,
      rebuild: false,
    });

    expect(lines[0]).toBe("🔥 PROJECT SUCCESSFULLY TORCHED! 🔥");
    expect(lines).toContain("📦 Dependency install skipped (rebuild disabled)");
    expect(lines).toContain("🐳 Docker rebuild skipped (rebuild disabled)");
    expect(lines.join(" ")).not.toContain("❌");
  });

  it("does not report an already clean project as a failure", () => {
    const lines = linesFor({ ...successRecord, buildAndCacheClean: false });

    expect(lines).toContain("✨ No build artifacts found (already clean)");
    expect(lines.join(" ")).not.toContain("❌");
  });

  it("says so when a step failed", () => {
    const lines = linesFor({ ...successRecord, dependencyInstall: false });

    expect(lines[0]).toContain("TORCHED WITH ERRORS");
    expect(lines).toContain("❌ Failed to install dependencies");
  });

  it("reports paths that could not be removed", () => {
    const lines = linesFor({ ...successRecord, cleanupFailures: 2 });

    expect(lines[0]).toContain("TORCHED WITH ERRORS");
    expect(lines).toContain(
      "❌ 2 path(s) could not be removed (in use or locked?)",
    );
    expect(lines.join(" ")).not.toContain("already clean");
  });

  it("reports Docker mode that could not run", () => {
    const lines = linesFor({
      ...successRecord,
      dockerClean: "DOCKER_UNAVAILABLE",
    });

    expect(lines[0]).toContain("TORCHED WITH ERRORS");
    expect(lines).toContain(
      "❌ Docker is not available - Docker steps did not run",
    );
  });

  it("does not claim a dry run torched anything when it found problems", () => {
    const lines = linesFor({
      ...successRecord,
      dockerClean: "DOCKER_UNAVAILABLE",
      dryRun: true,
    });

    expect(lines[0]).toContain("DRY RUN FOUND PROBLEMS - NOTHING WAS CHANGED");
  });

  it("makes clear that a dry run changed nothing", () => {
    const lines = linesFor({ ...dockerSuccessRecord, dryRun: true });

    expect(lines[0]).toContain("DRY RUN COMPLETE - NOTHING WAS CHANGED");
    expect(lines).toEqual(
      expect.arrayContaining([
        "🔥 All build artifacts & caches would be removed",
        "🔥 Package manager cache would be cleaned",
        "📦 Dependencies would be installed",
        "🐳 Docker containers, images and volumes would be removed",
        "🐳 Docker containers would be rebuilt",
        "🔥 Services would be started",
      ]),
    );
  });

  it("informs user that file logging is disabled when logfile is false", () => {
    const lines = linesFor({ ...successRecord, logfile: false });

    expect(lines.join(" ")).toContain(
      'Logging to torch-it.log is disabled; set "logfile": true in torchrc.json to enable it',
    );
  });
});

describe("torchFailed", () => {
  it.each<[string, TorchRecord, boolean]>([
    ["everything succeeded", successRecord, false],
    ["docker flow succeeded", dockerSuccessRecord, false],
    [
      "rebuild disabled",
      { ...successRecord, dependencyInstall: false, rebuild: false },
      false,
    ],
    ["install failed", { ...successRecord, dependencyInstall: false }, true],
    [
      "a path could not be removed",
      { ...successRecord, cleanupFailures: 1 },
      true,
    ],
    [
      "docker mode is on but docker is unavailable",
      { ...successRecord, dockerClean: "DOCKER_UNAVAILABLE" },
      true,
    ],
    [
      "docker cleanup failed",
      { ...successRecord, dockerClean: "DOCKER_FAIL" },
      true,
    ],
    [
      "docker rebuild failed",
      { ...dockerSuccessRecord, dockerRebuild: false },
      true,
    ],
    [
      "docker launch failed",
      { ...dockerSuccessRecord, dockerLaunch: false },
      true,
    ],
  ])("when %s", (_name, record, expected) => {
    expect(torchFailed(record)).toBe(expected);
  });
});
