import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("../../src/utils/ui", () => ({
  outputToConsole: vi.fn(),
}));

import * as fs from "fs";
import {
  getCustomPaths,
  getTorchRcConfig,
  resolveTorchRcConfig,
} from "../../src/utils/torchrc";
import { outputToConsole } from "../../src/utils/ui";
import { DEFAULT_TORCH_RC_CONFIG } from "../../src/types";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedReadFileSync = vi.mocked(fs.readFileSync);
const mockedOutputToConsole = vi.mocked(outputToConsole);

const setTorchRc = (content: unknown) => {
  mockedExistsSync.mockReturnValue(true);
  mockedReadFileSync.mockReturnValue(
    typeof content === "string" ? content : JSON.stringify(content),
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  mockedExistsSync.mockReturnValue(false);
});

describe("resolveTorchRcConfig from torchrc.json", () => {
  it("returns default config when torchrc.json does not exist", () => {
    expect(resolveTorchRcConfig()).toEqual({
      config: DEFAULT_TORCH_RC_CONFIG,
      problems: [],
    });
  });

  it("merges user config with defaults", () => {
    setTorchRc({ protectedPaths: [" important/ ", ""], dockerMode: true });

    expect(resolveTorchRcConfig()).toEqual({
      config: {
        ...DEFAULT_TORCH_RC_CONFIG,
        protectedPaths: ["important/"],
        dockerMode: true,
      },
      problems: [],
    });
  });

  it.each([
    ["invalid json", "torchrc.json is not valid JSON"],
    ["[]", "torchrc.json must contain a JSON object"],
    [
      { customPaths: "dist" },
      'torchrc.json "customPaths" must be an array of strings',
    ],
    [{ rebuild: "no" }, 'torchrc.json "rebuild" must be true or false'],
    [{ protectedPath: ["x"] }, 'Unknown option torchrc.json "protectedPath"'],
  ])("reports a problem for torchrc.json %j", (content, problem) => {
    setTorchRc(content);

    expect(resolveTorchRcConfig().problems).toEqual([problem]);
  });
});

describe("resolveTorchRcConfig from CLI arguments", () => {
  it("overrides file config with CLI arguments", () => {
    setTorchRc({ rebuild: true, customPaths: ["from-file"] });

    const { config, problems } = resolveTorchRcConfig([
      "--dockerMode=true",
      "--rebuild=false",
      "--logfile",
      '--customPaths=["path1","path2"]',
    ]);

    expect(problems).toEqual([]);
    expect(config).toEqual({
      ...DEFAULT_TORCH_RC_CONFIG,
      customPaths: ["path1", "path2"],
      dockerMode: true,
      logfile: true,
      rebuild: false,
    });
  });

  it.each([
    ["--protectedPaths=[temp/,logs/]", ["temp/", "logs/"]],
    ["--protectedPaths=temp/, logs/", ["temp/", "logs/"]],
    ["--protectedPaths='a=b'", ["a=b"]],
    ["--protectedPaths=dist", ["dist"]],
  ])("accepts the list form %s", (arg, expected) => {
    const { config, problems } = resolveTorchRcConfig([arg]);

    expect(problems).toEqual([]);
    expect(config.protectedPaths).toEqual(expected);
  });

  it.each([
    ["--protectedPath=dist", "Unknown option --protectedPath"],
    ["--rebuild=maybe", "--rebuild must be true or false"],
    ["--customPaths", "--customPaths must be an array of strings"],
    ["dist", "Unknown argument dist"],
    ["-x", "Unknown argument -x"],
  ])("reports a problem for %s", (arg, problem) => {
    expect(resolveTorchRcConfig([arg]).problems).toEqual([problem]);
  });
});

describe("getTorchRcConfig", () => {
  it("returns the resolved config when it is valid", () => {
    expect(getTorchRcConfig(["--rebuild=false"])).toEqual({
      ...DEFAULT_TORCH_RC_CONFIG,
      rebuild: false,
    });
  });

  it("reports every problem and exits without changing anything", () => {
    const mockedExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    getTorchRcConfig(["--nope", "--rebuild=maybe"]);

    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "Unknown option --nope",
      "fail",
    );
    expect(mockedOutputToConsole).toHaveBeenCalledWith(
      "--rebuild must be true or false",
      "fail",
    );
    expect(mockedExit).toHaveBeenCalledWith(1);
    mockedExit.mockRestore();
  });
});

describe("getCustomPaths", () => {
  it("combines customPaths, customDirs and customFiles without duplicates", () => {
    expect(
      getCustomPaths({
        ...DEFAULT_TORCH_RC_CONFIG,
        customPaths: ["a", "b"],
        customDirs: ["b", "c"],
        customFiles: ["d.txt"],
      }),
    ).toEqual(["a", "b", "c", "d.txt"]);
  });
});
