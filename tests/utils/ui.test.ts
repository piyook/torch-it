import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

vi.mock("../../src/utils/logger", () => ({
  logger: vi.fn(),
}));

import {
  configureOutput,
  isQuiet,
  outputToConsole,
  printBanner,
  printBox,
  printRisingFromAshesBanner,
  showInFull,
} from "../../src/utils/ui";
import { logger } from "../../src/utils/logger";
import { setJsonMode } from "../../src/utils/json-output";

const ESC = String.fromCharCode(27);

const setTerminal = (isTTY: boolean) => {
  process.stdout.isTTY = isTTY;
};

describe("ui output", () => {
  const originalIsTTY = process.stdout.isTTY;
  let stdout: MockInstance;
  let stderr: MockInstance;

  const stdoutLines = () => stdout.mock.calls.map((call) => call[0]);
  const stderrLines = () => stderr.mock.calls.map((call) => call[0]);

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NO_COLOR;
    stdout = vi.spyOn(console, "log").mockImplementation(() => {});
    stderr = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.stdout.isTTY = originalIsTTY;
    delete process.env.NO_COLOR;
    stdout.mockRestore();
    stderr.mockRestore();
    setTerminal(true);
    configureOutput({});
    process.stdout.isTTY = originalIsTTY;
  });

  describe("at a terminal", () => {
    beforeEach(() => {
      setTerminal(true);
      configureOutput({});
    });

    it("decorates lines with colour and emoji", () => {
      outputToConsole("dist removed", "success");

      expect(stdoutLines()).toEqual([
        `${ESC}[32m✅${ESC}[39m dist removed${ESC}[0m`,
      ]);
    });

    it("drops colour but keeps emoji when NO_COLOR is set", () => {
      process.env.NO_COLOR = "1";
      configureOutput({});

      outputToConsole("dist removed", "success");

      expect(stdoutLines()).toEqual(["✅ dist removed"]);
    });

    it("prints the banner and a boxed summary", () => {
      printBanner();
      printBox(["🔥 DONE 🔥"]);

      const output = stdoutLines().join("\n");
      expect(output).toContain("TORCH LIT");
      expect(output).toContain("╔");
    });

    it("switches to plain output with --plain", () => {
      configureOutput({ plain: true });

      outputToConsole("dist removed", "success");

      expect(stdoutLines()).toEqual(["ok: dist removed"]);
    });
  });

  describe("when output is captured", () => {
    beforeEach(() => {
      setTerminal(false);
      configureOutput({});
    });

    it.each([
      ["info", "🔥 Docker mode disabled", "Docker mode disabled"],
      ["success", "dist removed", "ok: dist removed"],
      ["step", "🔨 DEPENDENCY INSTALLATION", "> DEPENDENCY INSTALLATION"],
      ["info", "\nBASIC SETTINGS:", "BASIC SETTINGS:"],
      ["info", "  Docker Mode: false", "  Docker Mode: false"],
    ])("prints %s lines as plain text on stdout", (type, message, expected) => {
      outputToConsole(message, type);

      expect(stdoutLines()).toEqual([expected]);
      expect(stderrLines()).toEqual([]);
    });

    it.each([
      [
        "warn",
        "Skipping dist: it is a link",
        "warning: Skipping dist: it is a link",
      ],
      ["fail", "Failed to remove dist", "error: Failed to remove dist"],
    ])("prints %s lines on stderr", (type, message, expected) => {
      outputToConsole(message, type);

      expect(stderrLines()).toEqual([expected]);
      expect(stdoutLines()).toEqual([]);
    });

    it("prints no banners", () => {
      printBanner();
      printRisingFromAshesBanner();

      expect(stdout).not.toHaveBeenCalled();
    });

    it("prints the summary as plain lines without a box", () => {
      printBox([
        "🔥 PROJECT SUCCESSFULLY TORCHED! 🔥",
        "",
        "📦 Dependencies freshly installed",
      ]);

      expect(stdoutLines()).toEqual([
        "PROJECT SUCCESSFULLY TORCHED!",
        "Dependencies freshly installed",
      ]);
    });

    it("sends the plain text to the log file", () => {
      outputToConsole("dist removed", "success");

      expect(vi.mocked(logger)).toHaveBeenCalledWith("ok: dist removed");
    });
  });

  describe("with --json", () => {
    beforeEach(() => {
      setTerminal(true);
      setJsonMode(true);
      configureOutput({});
    });

    afterEach(() => {
      setJsonMode(false);
    });

    it("prints nothing on stdout and keeps problems on stderr as plain text", () => {
      outputToConsole("dist removed", "success");
      outputToConsole("Scanning...", "step");
      printBanner();
      printBox(["PROJECT SUCCESSFULLY TORCHED!"]);
      outputToConsole("Failed to remove dist", "fail");

      expect(stdout).not.toHaveBeenCalled();
      expect(stderrLines()).toEqual(["error: Failed to remove dist"]);
    });
  });

  describe("with --quiet", () => {
    beforeEach(() => {
      setTerminal(false);
      configureOutput({ quiet: true });
    });

    it("prints only warnings, errors and the summary", () => {
      outputToConsole("Scanning...", "step");
      outputToConsole("dist removed", "success");
      outputToConsole("Docker mode disabled", "info");
      outputToConsole("Skipping dist", "warn");
      outputToConsole("Failed to remove dist", "fail");
      printBox(["TORCHED WITH ERRORS"]);

      expect(isQuiet()).toBe(true);
      expect(stdoutLines()).toEqual(["TORCHED WITH ERRORS"]);
      expect(stderrLines()).toEqual([
        "warning: Skipping dist",
        "error: Failed to remove dist",
      ]);
    });

    it("still writes every line to the log file", () => {
      outputToConsole("dist removed", "success");

      expect(vi.mocked(logger)).toHaveBeenCalledWith("ok: dist removed");
    });

    it("can be lifted for output the user must see", () => {
      showInFull(() => outputToConsole("dist (DIR)", "info"));
      outputToConsole("hidden again", "info");

      expect(stdoutLines()).toEqual(["dist (DIR)"]);
      expect(isQuiet()).toBe(true);
    });
  });
});
