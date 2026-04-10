import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  rmSync: vi.fn(),
}));

vi.mock("./ui", () => ({
  outputToConsole: vi.fn(),
}));

vi.mock("./system", () => ({
  hasCmd: vi.fn(),
  run: vi.fn(),
}));

import * as fs from "fs";
import { cleanupBuildsAndCaches } from "./cleanup";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedRmSync = vi.mocked(fs.rmSync);

describe("cleanupBuildsAndCaches dry-run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NUKE_DRY_RUN = "1";
  });

  it("does not remove directories in dry-run mode", () => {
    mockedExistsSync.mockImplementation((target) => target === "dist");

    const cleaned = cleanupBuildsAndCaches();

    expect(cleaned).toBe(true);
    expect(mockedRmSync).not.toHaveBeenCalled();
  });
});
