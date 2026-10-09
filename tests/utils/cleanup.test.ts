import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  rmSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
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
  cleanupPackageManagerCaches,
} from "../../src/utils/cleanup";
import { hasCmd, run } from "../../src/utils/system";
import { DEFAULT_TORCH_RC_CONFIG } from "../../src/types";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedRmSync = vi.mocked(fs.rmSync);
const mockedReaddirSync = vi.mocked(fs.readdirSync);
const mockedStatSync = vi.mocked(fs.statSync);
const mockedHasCmd = vi.mocked(hasCmd);
const mockedRun = vi.mocked(run);

const rootFile = (name: string) => ({ name, isFile: () => true });

const removedTargets = () => mockedRmSync.mock.calls.map((call) => call[0]);

const setExistingPaths = (...paths: string[]) => {
  mockedExistsSync.mockImplementation((target) =>
    paths.includes(String(target)),
  );
};

describe("cleanupBuildsAndCaches", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TORCH_DRY_RUN;
    mockedReaddirSync.mockReturnValue([]);
  });

  it("does not remove directories in dry-run mode", () => {
    process.env.TORCH_DRY_RUN = "1";
    setExistingPaths("dist");

    const cleaned = cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG);

    expect(cleaned).toBe(true);
    expect(mockedRmSync).not.toHaveBeenCalled();
  });

  it("removes default targets and reports a clean project", () => {
    setExistingPaths("dist", "node_modules");

    expect(cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG)).toBe(true);
    expect(removedTargets()).toEqual(["node_modules", "dist"]);

    mockedRmSync.mockClear();
    setExistingPaths();

    expect(cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG)).toBe(false);
    expect(mockedRmSync).not.toHaveBeenCalled();
  });

  it("honours protected and custom paths passed in the config", () => {
    setExistingPaths("dist", "node_modules", "keep", "extra");

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["dist/", "keep"],
      customPaths: ["extra", "keep"],
    });

    expect(removedTargets()).toEqual(["node_modules", "extra"]);
  });

  it("keeps a protected file inside a directory that is otherwise removed", () => {
    setExistingPaths("dist", "dist/keep.json", "dist/bundle.js");
    mockedStatSync.mockReturnValue({ isDirectory: () => true } as fs.Stats);
    mockedReaddirSync.mockImplementation(((target: string) =>
      target === "dist" ? ["keep.json", "bundle.js"] : []) as any);

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["dist/keep.json"],
    });

    expect(removedTargets()).toEqual(["dist/bundle.js"]);
  });

  it("only removes root files that really match a glob pattern", () => {
    const files = ["debug.log", "catalog.json", "blog.md", "pkg-1.0.0.tgz"];
    setExistingPaths(...files);
    mockedReaddirSync.mockReturnValue(files.map(rootFile) as any);

    cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG);

    expect(removedTargets()).toEqual(["debug.log", "pkg-1.0.0.tgz"]);
  });

  it("does not delete its own log file when logging is enabled", () => {
    const files = ["debug.log", "torch-it.log"];
    setExistingPaths(...files);
    mockedReaddirSync.mockReturnValue(files.map(rootFile) as any);

    cleanupBuildsAndCaches({ ...DEFAULT_TORCH_RC_CONFIG, logfile: true });

    expect(removedTargets()).toEqual(["debug.log"]);
  });
});

describe("cleanupPackageManagerCaches", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TORCH_DRY_RUN;
  });

  it("cleans only the cache of the package manager the project uses", () => {
    setExistingPaths("yarn.lock");
    mockedHasCmd.mockReturnValue(true);
    mockedRun.mockReturnValue(true);

    expect(cleanupPackageManagerCaches()).toBe(true);
    expect(mockedRun.mock.calls).toEqual([["yarn cache clean"]]);
  });

  it("returns false when no package manager is available", () => {
    setExistingPaths();
    mockedHasCmd.mockReturnValue(false);

    expect(cleanupPackageManagerCaches()).toBe(false);
    expect(mockedRun).not.toHaveBeenCalled();
  });
});
