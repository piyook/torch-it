import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  rmSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("../../src/utils/ui", () => ({
  outputToConsole: vi.fn(),
}));

vi.mock("../../src/utils/system", () => ({
  hasCmd: vi.fn(),
  run: vi.fn(),
}));

import * as fs from "fs";
import {
  cleanupBuildsAndCaches,
  getTorchRcConfig,
  getTorchRcConfigFromFile,
} from "../../src/utils/cleanup";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedRmSync = vi.mocked(fs.rmSync);
const mockedReadFileSync = vi.mocked(fs.readFileSync);

describe("cleanupBuildsAndCaches dry-run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TORCH_DRY_RUN = "1";
  });

  it("does not remove directories in dry-run mode", () => {
    mockedExistsSync.mockImplementation((target) => target === "dist");

    const cleaned = cleanupBuildsAndCaches();

    expect(cleaned).toBe(true);
    expect(mockedRmSync).not.toHaveBeenCalled();
  });
});

describe("cleanupBuildsAndCaches with protected paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TORCH_DRY_RUN = "1";
  });

  it("skips protected paths from cleanup", () => {
    mockedExistsSync.mockImplementation(
      (target) =>
        target === "torchrc.json" ||
        target === "dist" ||
        target === "node_modules" ||
        target === "protected/path",
    );
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        protectedPaths: ["dist", "protected/path"],
      }),
    );

    const cleaned = cleanupBuildsAndCaches();

    expect(cleaned).toBe(true); // node_modules should still be cleaned
    // Should not try to remove protected paths, but should "clean" node_modules
    expect(mockedRmSync).not.toHaveBeenCalled(); // dry-run
  });
});

describe("getTorchRcConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default config when torchrc.json does not exist", () => {
    mockedExistsSync.mockReturnValue(false);

    const config = getTorchRcConfigFromFile();

    expect(config).toEqual({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: false,
      logfile: false,
      rebuild: true,
    });
  });

  it("merges user config with defaults", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        protectedPaths: ["important/"],
        dockerMode: false,
        logfile: false,
      }),
    );

    const config = getTorchRcConfigFromFile();

    expect(config).toEqual({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: ["important/"],
      dockerMode: false,
      logfile: false,
      rebuild: true,
    });
  });

  it("returns defaults when torchrc.json is invalid JSON", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("invalid json");

    const config = getTorchRcConfigFromFile();

    expect(config).toEqual({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: false,
      logfile: false,
      rebuild: true,
    });
  });

  it("overrides config with CLI arguments", () => {
    mockedExistsSync.mockReturnValue(false);

    const config = getTorchRcConfig([
      "--dockerMode=false",
      "--rebuild=false",
      '--customPaths=["path1","path2"]',
    ]);

    expect(config).toEqual({
      customPaths: ["path1", "path2"],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: false,
      logfile: false,
      rebuild: false,
    });
  });
});
