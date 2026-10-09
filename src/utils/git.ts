import { execFileSync } from "child_process";

// Files git tracks that match the pathspecs, relative to the current directory.
// Empty when git is missing or this is not a repository: there is nothing to guard.
export function listTrackedFiles(pathspecs: string[]): string[] {
  if (pathspecs.length === 0) return [];

  try {
    const output = execFileSync("git", ["ls-files", "-z", "--", ...pathspecs], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 256 * 1024 * 1024,
    });
    return output.split("\0").filter((entry) => entry.length > 0);
  } catch {
    return [];
  }
}
