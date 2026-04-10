import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NukeRecord } from "../types";

vi.mock("./ui", () => ({
  printBox: vi.fn(),
}));

import { statusMessage } from "./status";
import { printBox } from "./ui";

const mockedPrintBox = vi.mocked(printBox);

describe("statusMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prints no-docker status when docker config is absent", () => {
    const record: NukeRecord = {
      dockerClean: "NO_DOCKER",
      buildAndCacheClean: true,
      packageManagerClean: true,
      dependencyInstall: true,
      dockerRebuild: false,
      dockerLaunch: false,
    };

    statusMessage(record);

    expect(mockedPrintBox).toHaveBeenCalledTimes(1);
    const lines = mockedPrintBox.mock.calls[0][0];
    expect(lines).toContain("🧹 All build artifacts & caches removed");
    expect(lines).toContain("📦 Dependencies freshly installed");
    expect(lines).toContain("🐳 No Docker containers found");
  });

  it("prints docker rebuild and launch success messages when docker flow succeeds", () => {
    const record: NukeRecord = {
      dockerClean: "OK",
      buildAndCacheClean: true,
      packageManagerClean: true,
      dependencyInstall: true,
      dockerRebuild: true,
      dockerLaunch: true,
    };

    statusMessage(record);

    const lines = mockedPrintBox.mock.calls[0][0];
    expect(lines).toContain("🐳 Docker containers rebuilt from scratch");
    expect(lines).toContain("🚀 Services running in detached mode");
  });
});
