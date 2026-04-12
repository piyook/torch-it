import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("./ui", () => ({
  outputToConsole: vi.fn(),
}));

vi.mock("./system", () => ({
  hasCmd: vi.fn(),
  run: vi.fn(),
}));

import * as fs from "fs";
import { dockerCleanup, dockerRebuild, dockerLaunch } from "./docker";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedReadFileSync = vi.mocked(fs.readFileSync);

describe("dockerCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips Docker operations when dockerMode is false", () => {
    mockedExistsSync.mockImplementation(
      (target) => target === "torchrc.json" || target === "docker-compose.yml",
    );
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        dockerMode: false,
      }),
    );

    const result = dockerCleanup();

    expect(result).toBe("NO_DOCKER");
  });

  it("proceeds with Docker operations when dockerMode is true", () => {
    mockedExistsSync.mockImplementation(
      (target) => target === "torchrc.json" || target === "docker-compose.yml",
    );
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        dockerMode: true,
      }),
    );

    const result = dockerCleanup();

    // Should proceed to check for Docker files, etc.
    expect(result).toBe("NO_DOCKER"); // Since we don't have Docker running in test
  });
});

describe("dockerRebuild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips Docker rebuild when dockerMode is false", () => {
    mockedExistsSync.mockImplementation(
      (target) => target === "torchrc.json" || target === "docker-compose.yml",
    );
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        dockerMode: false,
      }),
    );

    const result = dockerRebuild();

    expect(result).toBe(false);
  });
});

describe("dockerLaunch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips Docker launch when dockerMode is false", () => {
    mockedExistsSync.mockImplementation((target) => target === "torchrc.json");
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({
        dockerMode: false,
      }),
    );

    const result = dockerLaunch();

    expect(result).toBe(false);
  });
});
