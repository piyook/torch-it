import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/utils/cli";

const noFlags = {
  isHelp: false,
  isVersion: false,
  isConfig: false,
  isDryRun: false,
  assumeYes: false,
  isQuiet: false,
  isPlain: false,
  filteredArgs: [],
};

describe("parseCliArgs", () => {
  it("returns no flags for no arguments", () => {
    expect(parseCliArgs([])).toEqual(noFlags);
  });

  it.each([
    ["--help", "isHelp"],
    ["-h", "isHelp"],
    ["--version", "isVersion"],
    ["-v", "isVersion"],
    ["--config", "isConfig"],
    ["--test", "isDryRun"],
    ["--yes", "assumeYes"],
    ["-y", "assumeYes"],
    ["--quiet", "isQuiet"],
    ["-q", "isQuiet"],
    ["--plain", "isPlain"],
  ])("reads %s", (arg, flag) => {
    expect(parseCliArgs([arg])).toEqual({ ...noFlags, [flag]: true });
  });

  it("passes everything else on for the config parser to check", () => {
    const parsed = parseCliArgs([
      "--yes",
      "--rebuild=false",
      "--quiet",
      "--bogus",
      "stray",
    ]);

    expect(parsed.assumeYes).toBe(true);
    expect(parsed.isQuiet).toBe(true);
    expect(parsed.filteredArgs).toEqual([
      "--rebuild=false",
      "--bogus",
      "stray",
    ]);
  });
});
