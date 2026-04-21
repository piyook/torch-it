import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./utils/docker", () => ({
  dockerCleanup: vi.fn(),
  dockerRebuild: vi.fn(),
  dockerLaunch: vi.fn(),
}));

vi.mock("./utils/cleanup", () => ({
  cleanupBuildsAndCaches: vi.fn(),
  cleanupPackageManagerCaches: vi.fn(),
  getTorchRcConfig: vi.fn(),
}));

vi.mock("./utils/dependency", () => ({
  installDependencies: vi.fn(),
}));

vi.mock("./utils/ui", () => ({
  printBanner: vi.fn(),
  outputToConsole: vi.fn(),
  printRisingFromAshesBanner: vi.fn(),
}));

vi.mock("./utils/logger", () => ({
  setLoggerEnabled: vi.fn(),
  clearLog: vi.fn(),
}));

vi.mock("./utils/status", () => ({
  statusMessage: vi.fn(),
}));

import { dockerCleanup, dockerRebuild, dockerLaunch } from "./utils/docker";
import {
  cleanupBuildsAndCaches,
  cleanupPackageManagerCaches,
  getTorchRcConfig,
} from "./utils/cleanup";
import { installDependencies } from "./utils/dependency";
import { outputToConsole, printRisingFromAshesBanner } from "./utils/ui";

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
    process.argv = ["node", "torch-it"];
  });

  it("performs dependency installation when rebuild is true", async () => {
    mockedGetTorchRcConfig.mockReturnValue({
      customPaths: [],
      customDirs: [],
      customFiles: [],
      protectedPaths: [],
      dockerMode: true,
      logfile: false,
      rebuild: true,
    });

    mockedDockerCleanup.mockReturnValue("OK");
    mockedCleanupBuildsAndCaches.mockReturnValue(true);
    mockedCleanupPackageManagerCaches.mockReturnValue(true);
    mockedInstallDependencies.mockReturnValue(true);
    mockedDockerRebuild.mockReturnValue(true);
    mockedDockerLaunch.mockReturnValue(true);

    // Import and run the main module
    await import("./torch.js");

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
      rebuild: false,
    });

    mockedDockerCleanup.mockReturnValue("OK");
    mockedCleanupBuildsAndCaches.mockReturnValue(true);
    mockedCleanupPackageManagerCaches.mockReturnValue(true);

    // Import and run the main module
    await import("./torch.js");

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
      rebuild: true,
    });

    mockedDockerCleanup.mockReturnValue("NO_DOCKER");
    mockedCleanupBuildsAndCaches.mockReturnValue(true);
    mockedCleanupPackageManagerCaches.mockReturnValue(true);
    mockedInstallDependencies.mockReturnValue(true);

    // Import and run the main module
    await import("./torch.js");

    expect(mockedPrintRisingFromAshesBanner).toHaveBeenCalled();
    expect(mockedInstallDependencies).toHaveBeenCalled();
    expect(mockedDockerRebuild).not.toHaveBeenCalled();
    expect(mockedDockerLaunch).not.toHaveBeenCalled();
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
      rebuild: true,
    });

    mockedDockerCleanup.mockReturnValue("OK");
    mockedCleanupBuildsAndCaches.mockReturnValue(true);
    mockedCleanupPackageManagerCaches.mockReturnValue(true);
    mockedInstallDependencies.mockReturnValue(true);
    mockedDockerRebuild.mockReturnValue(true);
    mockedDockerLaunch.mockReturnValue(true);

    // Import and run the main module
    await import("./torch.js");

    expect(process.env.TORCH_DRY_RUN).toBe("1");
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "Running in --test dry-run mode (no files or services will be changed)",
      "warn",
    );
  });

  it("displays help message and exits when --help flag is used", async () => {
    process.argv = ["node", "torch-it", "--help"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    try {
      // Import and run the main module
      await import("./torch.js");

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
    process.argv = ["node", "torch-it", "--version"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    try {
      // Import and run the main module
      await import("./torch.js");

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
    process.argv = ["node", "torch-it", "-v"];

    // Mock process.exit to prevent actual exit during test
    const mockExit = vi.fn() as any;
    const originalExit = process.exit;
    process.exit = mockExit;

    try {
      // Import and run the main module
      await import("./torch.js");

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
});
