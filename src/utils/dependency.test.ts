import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("./system", () => ({
  hasCmd: vi.fn(),
  run: vi.fn(),
}));

vi.mock("./ui", () => ({
  outputToConsole: vi.fn(),
}));

import * as fs from "fs";
import { installDependencies } from "./dependency";
import { hasCmd, run } from "./system";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedHasCmd = vi.mocked(hasCmd);
const mockedRun = vi.mocked(run);

describe("installDependencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses pnpm when pnpm lockfile exists and pnpm is available", () => {
    mockedExistsSync.mockImplementation(
      (filePath) => filePath === "pnpm-lock.yaml",
    );
    mockedHasCmd.mockImplementation((cmd) => cmd === "pnpm");
    mockedRun.mockReturnValue(true);

    const installed = installDependencies();

    expect(installed).toBe(true);
    expect(mockedRun).toHaveBeenCalledWith("pnpm install");
  });

  it("falls back to npm when no lockfiles exist", () => {
    mockedExistsSync.mockReturnValue(false);
    mockedHasCmd.mockImplementation((cmd) => cmd === "npm");
    mockedRun.mockReturnValue(true);

    const installed = installDependencies();

    expect(installed).toBe(true);
    expect(mockedRun).toHaveBeenCalledWith("npm install");
  });

  it("returns false when no package manager is available", () => {
    mockedExistsSync.mockReturnValue(false);
    mockedHasCmd.mockReturnValue(false);

    const installed = installDependencies();

    expect(installed).toBe(false);
    expect(mockedRun).not.toHaveBeenCalled();
  });
});
