import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/docker", () => ({
  dockerCleanup: vi.fn(),
  dockerRebuild: vi.fn(),
  dockerLaunch: vi.fn(),
  DOCKER_FILES: [],
}));

vi.mock("../src/utils/cleanup", () => ({
  cleanupBuildsAndCaches: vi.fn(),
  cleanupPackageManagerCaches: vi.fn(),
}));

vi.mock("../src/utils/torchrc", () => ({
  getTorchRcConfig: vi.fn(),
  getCustomPaths: vi.fn(() => []),
  getProtectedPaths: vi.fn(() => []),
}));

vi.mock("../src/utils/dependency", () => ({
  installDependencies: vi.fn(),
}));

vi.mock("../src/utils/ui", () => ({
  configureOutput: vi.fn(),
  printBanner: vi.fn(),
  outputToConsole: vi.fn(),
  printRisingFromAshesBanner: vi.fn(),
  showInFull: vi.fn((fn: () => void) => fn()),
}));

vi.mock("../src/utils/logger", () => ({
  setLoggerEnabled: vi.fn(),
  clearLog: vi.fn(),
}));

vi.mock("../src/utils/prompt", () => ({
  promptYesNo: vi.fn(),
}));

vi.mock("../src/utils/status", () => ({
  statusMessage: vi.fn(),
  torchFailed: vi.fn(() => false),
}));

import {
  dockerCleanup,
  dockerRebuild,
  dockerLaunch,
} from "../src/utils/docker";
import {
  cleanupBuildsAndCaches,
  cleanupPackageManagerCaches,
} from "../src/utils/cleanup";
import { getTorchRcConfig } from "../src/utils/torchrc";
import { installDependencies } from "../src/utils/dependency";
import { outputToConsole, printRisingFromAshesBanner } from "../src/utils/ui";
import { clearLog } from "../src/utils/logger";
import { promptYesNo } from "../src/utils/prompt";
import { torchFailed } from "../src/utils/status";

const mockedDockerCleanup = vi.mocked(dockerCleanup);
const mockedDockerRebuild = vi.mocked(dockerRebuild);
const mockedDockerLaunch = vi.mocked(dockerLaunch);
const mockedCleanupBuildsAndCaches = vi.mocked(cleanupBuildsAndCaches);
const mockedCleanupPackageManagerCaches = vi.mocked(
  cleanupPackageManagerCaches,
);
const mockedGetTorchRcConfig = vi.mocked(getTorchRcConfig);
const mockedInstallDependencies = vi.mocked(installDependencies);
const mockedOutputToConsole = vi.mocked(outputToConsole);
const mockedPrintRisingFromAshesBanner = vi.mocked(printRisingFromAshesBanner);

describe("torch main functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Mock process.argv
    process.argv = ["node", "torch-it", "--yes"];
    delete process.env.TORCH_DRY_RUN;
    mockedCleanupBuildsAndCaches.mockReturnValue({
      cleaned: true,
      failed: 0,
      tracked: 0,
      paths: { removed: [], failed: [], tracked: [] },
    });
  });

  it("performs dependency installation when rebuild is true", async () => {
    mockedGetTorchRcConfig.mockReturnValue({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: true,
      logfile: false,
      cacheClean: true,
      dockerVolumes: false,
      only: [],
      allowTracked: false,
      rebuild: true,
    });

    mockedDockerCleanup.mockReturnValue("OK");
    mockedCleanupBuildsAndCaches.mockReturnValue({
      cleaned: true,
      failed: 0,
      tracked: 0,
      paths: { removed: [], failed: [], tracked: [] },
    });
    mockedCleanupPackageManagerCaches.mockReturnValue(true);
    mockedInstallDependencies.mockReturnValue(true);
    mockedDockerRebuild.mockReturnValue(true);
    mockedDockerLaunch.mockReturnValue(true);

    // Import and run the main module
    await import("../src/torch.js");

    expect(mockedPrintRisingFromAshesBanner).toHaveBeenCalled();
    expect(mockedInstallDependencies).toHaveBeenCalled();
    expect(mockedDockerRebuild).toHaveBeenCalled();
    expect(mockedDockerLaunch).toHaveBeenCalled();
  });

  it("skips dependency installation and Docker rebuild when rebuild is false", async () => {
    mockedGetTorchRcConfig.mockReturnValue({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: true,
      logfile: false,
      cacheClean: true,
      dockerVolumes: false,
      only: [],
      allowTracked: false,
      rebuild: false,
    });

    mockedDockerCleanup.mockReturnValue("OK");
    mockedCleanupBuildsAndCaches.mockReturnValue({
      cleaned: true,
      failed: 0,
      tracked: 0,
      paths: { removed: [], failed: [], tracked: [] },
    });
    mockedCleanupPackageManagerCaches.mockReturnValue(true);

    // Import and run the main module
    await import("../src/torch.js");

    expect(mockedPrintRisingFromAshesBanner).not.toHaveBeenCalled();
    expect(mockedInstallDependencies).not.toHaveBeenCalled();
    expect(mockedDockerRebuild).not.toHaveBeenCalled();
    expect(mockedDockerLaunch).not.toHaveBeenCalled();
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "Rebuild disabled - skipping dependency installation",
      "info",
    );
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "Rebuild disabled - skipping Docker rebuild",
      "info",
    );
  });

  it("skips Docker rebuild when docker cleanup fails", async () => {
    mockedGetTorchRcConfig.mockReturnValue({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: true,
      logfile: false,
      cacheClean: true,
      dockerVolumes: false,
      only: [],
      allowTracked: false,
      rebuild: true,
    });

    mockedDockerCleanup.mockReturnValue("NO_DOCKER");
    mockedCleanupBuildsAndCaches.mockReturnValue({
      cleaned: true,
      failed: 0,
      tracked: 0,
      paths: { removed: [], failed: [], tracked: [] },
    });
    mockedCleanupPackageManagerCaches.mockReturnValue(true);
    mockedInstallDependencies.mockReturnValue(true);

    // Import and run the main module
    await import("../src/torch.js");

    expect(mockedPrintRisingFromAshesBanner).toHaveBeenCalled();
    expect(mockedInstallDependencies).toHaveBeenCalled();
    expect(mockedDockerRebuild).not.toHaveBeenCalled();
    expect(mockedDockerLaunch).not.toHaveBeenCalled();
  });

  it("refuses to run without --yes when there is no terminal to confirm on", async () => {
    process.argv = ["node", "torch-it"];
    const originalIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = false;

    // Stop at the exit, as the real process would
    const originalExit = process.exit;
    process.exit = vi.fn(() => {
      throw new Error("exit");
    }) as any;

    try {
      await expect(import("../src/torch.js")).rejects.toThrow("exit");

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(mockedOutputToConsole).toHaveBeenCalledWith(
        expect.stringContaining("Re-run with --yes"),
        "fail",
      );
      // Refused before anything is written, including the log file
      expect(vi.mocked(clearLog)).not.toHaveBeenCalled();
      expect(mockedCleanupBuildsAndCaches).not.toHaveBeenCalled();
    } finally {
      process.exit = originalExit;
      process.stdin.isTTY = originalIsTTY;
    }
  });

  it("exits with 3 and deletes nothing when the prompt is answered no", async () => {
    process.argv = ["node", "torch-it"];
    const originalIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = true;
    vi.mocked(promptYesNo).mockResolvedValue(false);

    // Stop at the exit, as the real process would
    const originalExit = process.exit;
    process.exit = vi.fn().mockImplementationOnce(() => {
      throw new Error("exit");
    }) as any;
    const mockedConsoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await import("../src/torch.js");
      await vi.waitFor(() => expect(process.exit).toHaveBeenCalledWith(3));

      expect(mockedCleanupBuildsAndCaches).not.toHaveBeenCalled();
    } finally {
      process.exit = originalExit;
      process.stdin.isTTY = originalIsTTY;
      mockedConsoleError.mockRestore();
    }
  });

  it("exits with 2 when the run went ahead and a step failed", async () => {
    vi.mocked(torchFailed).mockReturnValueOnce(true);

    try {
      await import("../src/torch.js");
      await vi.waitFor(() => expect(process.exitCode).toBe(2));
    } finally {
      process.exitCode = undefined;
    }
  });

  it("handles dry run mode correctly", async () => {
    process.argv = ["node", "torch-it", "--test"];

    mockedGetTorchRcConfig.mockReturnValue({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: true,
      logfile: false,
      cacheClean: true,
      dockerVolumes: false,
      only: [],
      allowTracked: false,
      rebuild: true,
    });

    mockedDockerCleanup.mockReturnValue("OK");
    mockedCleanupBuildsAndCaches.mockReturnValue({
      cleaned: true,
      failed: 0,
      tracked: 0,
      paths: { removed: [], failed: [], tracked: [] },
    });
    mockedCleanupPackageManagerCaches.mockReturnValue(true);
    mockedInstallDependencies.mockReturnValue(true);
    mockedDockerRebuild.mockReturnValue(true);
    mockedDockerLaunch.mockReturnValue(true);

    // Import and run the main module
    await import("../src/torch.js");

    expect(process.env.TORCH_DRY_RUN).toBe("1");
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "Running in --test dry-run mode (no files or services will be changed)",
      "info",
    );
  });

  it("displays help message and exits when --help flag is used", async () => {
    process.argv = ["node", "torch-it", "--help", "--yes"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    try {
      // Import and run the main module
      await import("../src/torch.js");

      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockedOutputToConsole).toHaveBeenCalledWith(
        expect.stringContaining("🔥 Torch It - Project Environment Reset Tool"),
        "info",
      );
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
  });

  it("displays version information and exits when --version flag is used", async () => {
    process.argv = ["node", "torch-it", "--version", "--yes"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    try {
      // Import and run the main module
      await import("../src/torch.js");

      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockedOutputToConsole).toHaveBeenCalledWith(
        expect.stringContaining("torch-it v"),
        "info",
      );
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
  });

  it("displays version information and exits when -v flag is used", async () => {
    process.argv = ["node", "torch-it", "-v", "--yes"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    try {
      // Import and run the main module
      await import("../src/torch.js");

      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockedOutputToConsole).toHaveBeenCalledWith(
        expect.stringContaining("torch-it v"),
        "info",
      );
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
  });

  it("displays configuration information and exits when --config flag is used", async () => {
    process.argv = ["node", "torch-it", "--config", "--yes"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    mockedGetTorchRcConfig.mockReturnValue({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: true,
      logfile: false,
      cacheClean: true,
      dockerVolumes: false,
      only: [],
      allowTracked: false,
      rebuild: true,
    });

    try {
      // Import and run the main module
      await import("../src/torch.js");

      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockedOutputToConsole).toHaveBeenCalledWith(
        expect.stringContaining("TORCH-IT CONFIGURATION"),
        "info",
      );
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
  });
});
