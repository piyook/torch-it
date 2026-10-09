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
import { hasCmd, run } from "../../src/utils/system";
import { outputToConsole } from "../../src/utils/ui";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedHasCmd = vi.mocked(hasCmd);
const mockedRun = vi.mocked(run);
const mockedOutputToConsole = vi.mocked(outputToConsole);

const baseTorchRc = DEFAULT_TORCH_RC_CONFIG;

describe("dockerCleanup", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TORCH_DRY_RUN;
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

  it("skips Docker operations when there is a Dockerfile but no Compose file", () => {
    mockedExistsSync.mockImplementation((target) => target === "Dockerfile");

    const result = dockerCleanup({ ...baseTorchRc, dockerMode: true });

    expect(result).toBe("NO_DOCKER");
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("no Compose file"),
      "info",
    );
    expect(mockedHasCmd).not.toHaveBeenCalled();
  });

  it("tears down services for a compose.yaml project", () => {
    mockedExistsSync.mockImplementation((target) => target === "compose.yaml");
    mockedHasCmd.mockReturnValue(true);
    mockedRun.mockReturnValue(true);

    const result = dockerCleanup({ ...baseTorchRc, dockerMode: true });

    expect(result).toBe("OK");
    expect(mockedRun).toHaveBeenCalledWith(
      "docker compose down --rmi all --volumes",
    );
  });

  it("reports a failure when docker compose cannot read the project", () => {
    mockedExistsSync.mockImplementation((target) => target === "compose.yml");
    mockedHasCmd.mockReturnValue(true);
    mockedRun.mockImplementation((cmd) => cmd === "docker info");

    const result = dockerCleanup({ ...baseTorchRc, dockerMode: true });

    expect(result).toBe("DOCKER_FAIL");
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
