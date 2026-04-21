import { describe, expect, it } from "vitest";
import {
  BUILD_DIRS,
  CACHE_DIRS,
  CUSTOM_DIRS,
} from "../../src/constants/config";

describe("cleanup config directories", () => {
  it("includes common frontend build artifacts", () => {
    expect(BUILD_DIRS).toEqual(
      expect.arrayContaining([".next", ".vite", ".svelte-kit"]),
    );
  });

  it("includes common package manager cache directories", () => {
    expect(CACHE_DIRS).toEqual(
      expect.arrayContaining([
        ".pnpm-store",
        ".yarn/cache",
        ".npm",
        "node_modules/.cache",
      ]),
    );
  });

  it("exposes custom directories list for project-specific cleanup", () => {
    expect(Array.isArray(CUSTOM_DIRS)).toBe(true);
  });
});
