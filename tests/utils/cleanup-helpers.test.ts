import { describe, expect, it } from "vitest";
import * as path from "path";
import {
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
