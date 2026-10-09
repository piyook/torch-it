import { describe, expect, it } from "vitest";
import * as path from "path";
import {
  createProtectionIndex,
  containsProtectedPath,
  filterProtectedTargets,
  isInsideProject,
  isPathProtected,
} from "../../src/utils/cleanup-helpers";

describe("isPathProtected", () => {
  it.each([
    ["dist", "dist"],
    ["dist", "dist/"],
    ["dist", "./dist"],
    ["dist", "dist\\"],
    ["./dist/", "dist"],
    ["dist/assets/app.js", "dist"],
    ["android\\build", "android/build"],
    ["dist", "Dist"],
    ["DIST/app.js", "dist"],
    ["dist", "apps/../dist"],
    ["dist/keep.json", "dist//keep.json"],
    ["dist", path.resolve("dist")],
    ["dist", "."],
    ["dist", "./"],
  ])("protects %s when %s is protected", (target, protectedPath) => {
    expect(isPathProtected(target, [protectedPath])).toBe(true);
  });

  it.each([
    ["dist", "dist/keep.json"],
    ["distribution", "dist"],
    ["dist", "../dist"],
  ])("does not protect %s when %s is protected", (target, protectedPath) => {
    expect(isPathProtected(target, [protectedPath])).toBe(false);
  });
});

describe("containsProtectedPath", () => {
  it("is true only when a protected path sits inside the target", () => {
    expect(containsProtectedPath("dist", ["dist/keep.json"])).toBe(true);
    expect(containsProtectedPath("dist/", [".\\dist\\keep.json"])).toBe(true);
    expect(containsProtectedPath("dist", ["dist"])).toBe(false);
    expect(containsProtectedPath("dist", ["distribution/keep.json"])).toBe(
      false,
    );
  });
});

describe("createProtectionIndex", () => {
  it("answers for many protected paths at once", () => {
    const files = Array.from({ length: 5000 }, (_, i) => `build/src/f${i}.js`);
    const index = createProtectionIndex([...files, "dist/.gitkeep"]);

    expect(index.covers("build/src/f4999.js")).toBe(true);
    expect(index.covers("build/src/other.js")).toBe(false);
    expect(index.holds("build")).toBe(true);
    expect(index.holds("build/src")).toBe(true);
    expect(index.holds("dist")).toBe(true);
    expect(index.holds("dist/.gitkeep")).toBe(false);
    expect(index.holds("coverage")).toBe(false);
    expect(index.holds(".")).toBe(true);
  });

  it("protects nothing when given nothing", () => {
    const index = createProtectionIndex([]);

    expect(index.covers("dist")).toBe(false);
    expect(index.holds(".")).toBe(false);
  });
});

describe("isInsideProject", () => {
  it.each(["dist", "./dist/", "apps/web/.next", "a/../b", "..cache"])(
    "accepts %s",
    (target) => {
      expect(isInsideProject(target)).toBe(true);
    },
  );

  it.each([".", "./", "", "..", "../sibling", "a/../..", path.resolve("..")])(
    "rejects %j",
    (target) => {
      expect(isInsideProject(target)).toBe(false);
    },
  );
});

describe("filterProtectedTargets", () => {
  it("drops protected targets and keeps the rest", () => {
    expect(
      filterProtectedTargets(["dist", "build", ".cache"], ["dist/", "./build"]),
    ).toEqual([".cache"]);
  });
});
