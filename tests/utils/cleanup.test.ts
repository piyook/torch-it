import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  rmSync: vi.fn(),
  readdirSync: vi.fn(),
  lstatSync: vi.fn(),
}));

vi.mock("../../src/utils/ui", () => ({
  outputToConsole: vi.fn(),
  showInFull: vi.fn((fn: () => void) => fn()),
}));

vi.mock("../../src/utils/git", () => ({
  listTrackedFiles: vi.fn(() => []),
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
import { run } from "../../src/utils/system";
import { listTrackedFiles } from "../../src/utils/git";
import { outputToConsole } from "../../src/utils/ui";
import { DEFAULT_TORCH_RC_CONFIG } from "../../src/types";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedRmSync = vi.mocked(fs.rmSync);
const mockedReaddirSync = vi.mocked(fs.readdirSync);
const mockedLstatSync = vi.mocked(fs.lstatSync);
const mockedRun = vi.mocked(run);
const mockedOutputToConsole = vi.mocked(outputToConsole);

const rootFile = (name: string) => ({ name, isFile: () => true });

const removedTargets = () => mockedRmSync.mock.calls.map((call) => call[0]);

const setExistingPaths = (...paths: string[]) => {
  mockedExistsSync.mockImplementation((target) =>
    paths.includes(String(target)),
  );
};

const setDirectoryEntries = (directory: string, entries: string[]) => {
  mockedReaddirSync.mockImplementation(((target: string) =>
    target === directory ? entries : []) as any);
};

const setIsLink = (isLink: boolean) => {
  mockedLstatSync.mockReturnValue({
    isSymbolicLink: () => isLink,
  } as fs.Stats);
};

describe("cleanupBuildsAndCaches", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TORCH_DRY_RUN;
    mockedReaddirSync.mockReturnValue([]);
    setIsLink(false);
    vi.mocked(listTrackedFiles).mockReturnValue([]);
  });

  it("does not remove directories in dry-run mode", () => {
    process.env.TORCH_DRY_RUN = "1";
    setExistingPaths("dist");

    const result = cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG);

    expect(result).toEqual({ cleaned: true, failed: 0, tracked: 0 });
    expect(mockedRmSync).not.toHaveBeenCalled();
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "Would remove dist",
      "info",
    );
  });

  it("removes default targets and reports a clean project", () => {
    setExistingPaths("dist", "node_modules");

    expect(cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG)).toEqual({
      cleaned: true,
      failed: 0,
      tracked: 0,
    });
    expect(removedTargets()).toEqual(["node_modules", "dist"]);

    mockedRmSync.mockClear();
    setExistingPaths();

    expect(cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG)).toEqual({
      cleaned: false,
      failed: 0,
      tracked: 0,
    });
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

  it("protects a path whatever case it is written in", () => {
    setExistingPaths("dist", "node_modules");

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["Dist", "NODE_MODULES/"],
    });

    expect(mockedRmSync).not.toHaveBeenCalled();
  });

  it("keeps a protected file inside a directory that is otherwise removed", () => {
    setExistingPaths("dist", "dist/keep.json", "dist/bundle.js");
    setDirectoryEntries("dist", ["keep.json", "bundle.js"]);

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["dist/keep.json"],
    });

    expect(removedTargets()).toEqual(["dist/bundle.js"]);
  });

  it("removes a target in one go when the protected path inside it does not exist", () => {
    setExistingPaths("node_modules");

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["node_modules/.keep"],
    });

    expect(removedTargets()).toEqual(["node_modules"]);
    expect(mockedReaddirSync).not.toHaveBeenCalledWith("node_modules");
  });

  it("leaves a linked target alone when a protected path lies inside it", () => {
    setExistingPaths("dist", "dist/keep.json", "dist/bundle.js");
    setDirectoryEntries("dist", ["keep.json", "bundle.js"]);
    setIsLink(true);

    const result = cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["dist/keep.json"],
    });

    expect(mockedRmSync).not.toHaveBeenCalled();
    expect(result).toEqual({ cleaned: false, failed: 0, tracked: 0 });
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("Skipping dist: it is a link"),
      "warn",
    );
  });

  it("counts a path that cannot be removed as a failure and carries on", () => {
    setExistingPaths("dist", "node_modules");
    mockedRmSync.mockImplementation((target) => {
      if (target === "node_modules") throw new Error("EBUSY");
    });

    const result = cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG);

    expect(result).toEqual({ cleaned: true, failed: 1, tracked: 0 });
    expect(removedTargets()).toEqual(["node_modules", "dist"]);
    expect(mockedOutputToConsole).not.toHaveBeenCalledWith(
      expect.stringContaining("already clean"),
      "info",
    );
  });

  it("counts a directory that cannot be read as a failure and carries on", () => {
    setExistingPaths("dist", "dist/keep.json", "node_modules");
    mockedReaddirSync.mockImplementation(((target: string) => {
      if (target === "dist") throw new Error("EACCES");
      return [];
    }) as any);

    const result = cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      protectedPaths: ["dist/keep.json"],
    });

    expect(result).toEqual({ cleaned: true, failed: 1, tracked: 0 });
    expect(removedTargets()).toEqual(["node_modules"]);
  });

  describe("with files tracked in git inside the targets", () => {
    beforeEach(() => {
      setExistingPaths(
        "build",
        "build/app.js",
        "build/cache.tmp",
        "dist",
        "dist/.gitkeep",
        "dist/bundle.js",
        "node_modules",
      );
      mockedReaddirSync.mockImplementation(((target: string) => {
        if (target === "build") return ["app.js", "cache.tmp"];
        if (target === "dist") return [".gitkeep", "bundle.js"];
        return [];
      }) as any);
      vi.mocked(listTrackedFiles).mockReturnValue([
        "build/app.js",
        "dist/.gitkeep",
        "dist/deleted-from-disk.js",
      ]);
    });

    it("keeps them and removes what is around them", () => {
      const result = cleanupBuildsAndCaches(DEFAULT_TORCH_RC_CONFIG);

      expect(removedTargets()).toEqual([
        "node_modules",
        "dist/bundle.js",
        "build/cache.tmp",
      ]);
      expect(result).toEqual({ cleaned: true, failed: 0, tracked: 2 });
      expect(mockedOutputToConsole).toHaveBeenCalledWith(
        "Kept 2 file(s) tracked in git, under: build, dist. Pass --allowTracked=true to remove them too.",
        "warn",
      );
    });

    it("asks git only about the targets of this run", () => {
      cleanupBuildsAndCaches({ ...DEFAULT_TORCH_RC_CONFIG, only: ["build\\"] });

      expect(vi.mocked(listTrackedFiles)).toHaveBeenCalledWith([
        ":(literal)build",
      ]);
    });

    it("removes them too when allowTracked is on, without asking git", () => {
      const result = cleanupBuildsAndCaches({
        ...DEFAULT_TORCH_RC_CONFIG,
        allowTracked: true,
      });

      expect(removedTargets()).toEqual(["node_modules", "dist", "build"]);
      expect(result.tracked).toBe(0);
      expect(vi.mocked(listTrackedFiles)).not.toHaveBeenCalled();
    });
  });

  it("removes nothing but the paths in 'only' when it is set", () => {
    const files = ["debug.log"];
    setExistingPaths("dist", "node_modules", "extra", ...files);
    mockedReaddirSync.mockReturnValue(files.map(rootFile) as any);

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      only: ["node_modules", "missing"],
      customPaths: ["extra"],
    });

    expect(removedTargets()).toEqual(["node_modules"]);
  });

  it("still honours protected paths in 'only' mode", () => {
    setExistingPaths("dist", "node_modules");

    cleanupBuildsAndCaches({
      ...DEFAULT_TORCH_RC_CONFIG,
      only: ["node_modules", "dist"],
      protectedPaths: ["dist"],
    });

    expect(removedTargets()).toEqual(["node_modules"]);
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

  it("cleans only the cache of the package manager it is given", () => {
    mockedRun.mockReturnValue(true);

    expect(cleanupPackageManagerCaches("yarn")).toBe(true);
    expect(mockedRun.mock.calls).toEqual([["yarn cache clean"]]);
  });

  it("returns false when no package manager is available", () => {
    expect(cleanupPackageManagerCaches(null)).toBe(false);
    expect(mockedRun).not.toHaveBeenCalled();
  });
});
