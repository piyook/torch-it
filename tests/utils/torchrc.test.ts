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
  getProtectedPaths,
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
  it("adds CLI lists to the torchrc.json lists instead of replacing them", () => {
    setTorchRc({
      protectedPaths: ["important-data", "dist/keep.json"],
      customPaths: ["from-file"],
    });

    const { config, problems } = resolveTorchRcConfig([
      "--protectedPaths=coverage,important-data",
      "--customPaths=from-cli",
    ]);

    expect(problems).toEqual([]);
    expect(config.protectedPaths).toEqual([
      "important-data",
      "dist/keep.json",
      "coverage",
    ]);
    expect(config.customPaths).toEqual(["from-file", "from-cli"]);
  });

  it.each([".", "./", "..", "../sibling", "apps/../..", "/"])(
    "refuses to delete %s, which is the project root or outside it",
    (entry) => {
      expect(resolveTorchRcConfig([`--customPaths=${entry}`]).problems).toEqual(
        [`--customPaths entry "${entry}" is the project root or outside it`],
      );

      setTorchRc({ customDirs: [entry] });
      expect(resolveTorchRcConfig().problems).toEqual([
        `torchrc.json "customDirs" entry "${entry}" is the project root or outside it`,
      ]);
    },
  );

  it("allows protectedPaths to name anything", () => {
    expect(resolveTorchRcConfig(["--protectedPaths=..,."]).problems).toEqual(
      [],
    );
  });

  it("overrides file booleans with CLI arguments", () => {
    setTorchRc({ rebuild: true });

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

describe("getProtectedPaths", () => {
  it("adds the log file only while logging is on", () => {
    const config = { ...DEFAULT_TORCH_RC_CONFIG, protectedPaths: ["dist"] };

    expect(getProtectedPaths(config)).toEqual(["dist"]);
    expect(getProtectedPaths({ ...config, logfile: true })).toEqual([
      "dist",
      "torch-it.log",
    ]);
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
