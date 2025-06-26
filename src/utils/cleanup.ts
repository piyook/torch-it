import { outputToConsole } from "./ui";
import * as fs from "fs";
import { BUILD_DIRS, CACHE_DIRS } from "../constants/config";

const cleanup = () => {
  let removedCount = 0;
  outputToConsole(
    "Scanning for build artifacts and cache directories...",
    "step"
  );
  [...BUILD_DIRS, ...CACHE_DIRS].forEach((dir) => {
    if (fs.existsSync(dir)) {
      outputToConsole(`Removing ${dir}...`, "step");
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        outputToConsole(`${dir} removed`, "success");
        removedCount++;
      } catch {
        outputToConsole(`Failed to remove ${dir}`, "fail");
      }
    }
  });

  removedCount === 0
    ? outputToConsole(
        "No build artifacts or cache directories found (project already clean)",
        "info"
      )
    : outputToConsole(
        `Removed ${removedCount} build/cache directories`,
        "success"
      );
};

export { cleanup };
