import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/utils/cli";

const noFlags = {
  isHelp: false,
  isLlms: false,
  isVersion: false,
  isConfig: false,
  isDryRun: false,
  assumeYes: false,
  isQuiet: false,
  isPlain: false,
  isJson: false,
  filteredArgs: [],
};

describe("parseCliArgs", () => {
  it("returns no flags for no arguments", () => {
    expect(parseCliArgs([])).toEqual(noFlags);
  });

  it.each([
    ["--help", "isHelp"],
    ["-h", "isHelp"],
    ["--llms", "isLlms"],
    ["--version", "isVersion"],
    ["-v", "isVersion"],
    ["--config", "isConfig"],
    ["--test", "isDryRun"],
    ["--yes", "assumeYes"],
    ["-y", "assumeYes"],
    ["--quiet", "isQuiet"],
    ["-q", "isQuiet"],
    ["--plain", "isPlain"],
    ["--json", "isJson"],
  ])("reads %s", (arg, flag) => {
    expect(parseCliArgs([arg])).toEqual({ ...noFlags, [flag]: true });
  });

  it.each([
    [["--cwd=apps/web", "--test"], "apps/web"],
    [["--cwd", "apps/web", "--test"], "apps/web"],
    [["--test", "--cwd"], ""],
  ])("reads the working directory from %j", (args, cwd) => {
    const parsed = parseCliArgs(args);

    expect(parsed.cwd).toBe(cwd);
    expect(parsed.isDryRun).toBe(true);
    expect(parsed.filteredArgs).toEqual([]);
  });

  it("leaves cwd undefined when --cwd is not given", () => {
    expect(parseCliArgs(["--test"]).cwd).toBeUndefined();
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
