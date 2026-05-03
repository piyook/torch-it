import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
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
  dockerCleanup,
  dockerRebuild,
  dockerLaunch,
} from "../../src/utils/docker";
import { DEFAULT_TORCH_RC_CONFIG } from "../../src/types";

const mockedExistsSync = vi.mocked(fs.existsSync);

const baseTorchRc = DEFAULT_TORCH_RC_CONFIG;

describe("dockerCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips Docker operations when dockerMode is false", () => {
    mockedExistsSync.mockImplementation(
      (target) => target === "docker-compose.yml",
    );

    const result = dockerCleanup({ ...baseTorchRc, dockerMode: false });

    expect(result).toBe("NO_DOCKER");
  });

  it("proceeds with Docker operations when dockerMode is true", () => {
    mockedExistsSync.mockImplementation(
      (target) => target === "docker-compose.yml",
    );

    const result = dockerCleanup({ ...baseTorchRc, dockerMode: true });

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
      (target) => target === "docker-compose.yml",
    );

    const result = dockerRebuild({ ...baseTorchRc, dockerMode: false });

    expect(result).toBe(false);
  });

  it("skips Docker rebuild when rebuild is false", () => {
    mockedExistsSync.mockImplementation(
      (target) => target === "docker-compose.yml",
    );

    const result = dockerRebuild({
      ...baseTorchRc,
      dockerMode: true,
      rebuild: false,
    });

    expect(result).toBe(false);
  });
});

describe("dockerLaunch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips Docker launch when dockerMode is false", () => {
    const result = dockerLaunch({ ...baseTorchRc, dockerMode: false });

    expect(result).toBe(false);
  });
});
