import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

import { execFileSync } from "child_process";
import { listTrackedFiles } from "../../src/utils/git";

const mockedExecFileSync = vi.mocked(execFileSync);

describe("listTrackedFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the files git lists for the pathspecs", () => {
    mockedExecFileSync.mockReturnValue("build/app.js\0dist/.gitkeep\0");

    expect(listTrackedFiles([":(literal)build", ":(literal)dist"])).toEqual([
      "build/app.js",
      "dist/.gitkeep",
    ]);
    expect(mockedExecFileSync).toHaveBeenCalledWith(
      "git",
      ["ls-files", "-z", "--", ":(literal)build", ":(literal)dist"],
      expect.objectContaining({ encoding: "utf8" }),
    );
  });

  it("returns nothing when git is missing or this is not a repository", () => {
    mockedExecFileSync.mockImplementation(() => {
      throw new Error("fatal: not a git repository");
    });

    expect(listTrackedFiles([":(literal)dist"])).toEqual([]);
  });

  it("does not call git when there is nothing to ask about", () => {
    expect(listTrackedFiles([])).toEqual([]);
    expect(mockedExecFileSync).not.toHaveBeenCalled();
  });
});
