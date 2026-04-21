import * as fs from "fs";
import * as path from "path";
import { outputToConsole } from "./ui";

export interface CleanupOptions {
  isDryRun: boolean;
  protectedPaths: string[];
}

export function createCleanupTargetHandler(options: CleanupOptions) {
  const { isDryRun, protectedPaths } = options;
  let removedCount = 0;

  return {
    removedCount: () => removedCount,

    cleanupTarget: (target: string) => {
      if (fs.existsSync(target)) {
        outputToConsole(
          `${isDryRun ? "Would remove" : "Removing"} ${target}...`,
          "step",
        );
        try {
          if (!isDryRun) {
            fs.rmSync(target, { recursive: true, force: true });
          }
          outputToConsole(
            `${target} ${isDryRun ? "marked for removal (dry-run)" : "removed"}`,
            "success",
          );
          removedCount++;
        } catch {
          outputToConsole(`Failed to remove ${target}`, "fail");
        }
      }
    },

    cleanupFile: (filePath: string) => {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const isProtected = protectedPaths.some(
          (protectedPath) =>
            filePath === protectedPath ||
            filePath.startsWith(protectedPath + "/"),
        );

        if (!isProtected) {
          outputToConsole(
            `${isDryRun ? "Would remove" : "Removing"} ${filePath}...`,
            "step",
          );
          try {
            if (!isDryRun) {
              fs.unlinkSync(filePath);
            }
            outputToConsole(
              `${filePath} ${isDryRun ? "marked for removal (dry-run)" : "removed"}`,
              "success",
            );
            removedCount++;
          } catch {
            outputToConsole(`Failed to remove ${filePath}`, "fail");
          }
        }
      }
    },

    isPathProtected: (target: string) => {
      return protectedPaths.some(
        (protectedPath) =>
          target === protectedPath || target.startsWith(protectedPath + "/"),
      );
    },
  };
}

export function filterProtectedTargets(
  targets: string[],
  protectedPaths: string[],
): string[] {
  return targets.filter(
    (target) =>
      !protectedPaths.some(
        (protectedPath) =>
          target === protectedPath || target.startsWith(protectedPath + "/"),
      ),
  );
}

export function processGlobPattern(
  pattern: string,
  handler: ReturnType<typeof createCleanupTargetHandler>,
) {
  try {
    const files = fs
      .readdirSync(".", { withFileTypes: true })
      .filter((dirent) => {
        const name = dirent.name;
        return name.match(pattern.replace("*", ".*"));
      })
      .map((dirent) => dirent.name);

    for (const file of files) {
      const filePath = path.join(".", file);
      handler.cleanupFile(filePath);
    }
  } catch (error) {
    outputToConsole(`Failed to process pattern ${pattern}: ${error}`, "warn");
  }
}
