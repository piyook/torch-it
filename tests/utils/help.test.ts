import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/ui", () => ({
  outputToConsole: vi.fn(),
}));

import { outputToConsole } from "../../src/utils/ui";
import { showHelp } from "../../src/utils/help";

const mockedOutputToConsole = vi.mocked(outputToConsole);

describe("showHelp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays help message with all available options", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("🔥 Torch It - Project Environment Reset Tool"),
      "info",
    );
  });

  it("includes usage information", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("USAGE:"),
      "info",
    );
  });

  it("includes --help option", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("--help"),
      "info",
    );
  });

  it("includes --test option", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("--test"),
      "info",
    );
  });

  it("includes --yes / -y option", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("--yes"),
      "info",
    );
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("-y"),
      "info",
    );
  });

  it("includes configuration options", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("--dockerMode"),
      "info",
    );
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("--rebuild"),
      "info",
    );
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("--logfile"),
      "info",
    );
  });

  it("includes examples", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("EXAMPLES:"),
      "info",
    );
  });

  it("includes configuration information", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("CONFIGURATION:"),
      "info",
    );
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("torchrc.json"),
      "info",
    );
  });

  it("includes repository link", () => {
    showHelp();

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      expect.stringContaining("https://github.com/piyook/torch-it"),
      "info",
    );
  });
});
