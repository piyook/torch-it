import { outputToConsole } from "./ui";
import { installWithPackageManager } from "./package-managers";
import type { PackageManager } from "./package-managers";

const installDependencies = (packageManager: PackageManager | null) => {
  outputToConsole(
    "Detecting package manager and installing dependencies...",
    "step",
  );

  if (!packageManager) {
    outputToConsole(
      "No package manager found (npm/yarn/pnpm). Please install dependencies manually.",
      "fail",
    );
    return false;
  }

  return installWithPackageManager(packageManager);
};

export { installDependencies };
