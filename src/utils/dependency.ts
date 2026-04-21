import { outputToConsole } from "./ui";
import {
  detectPackageManager,
  installWithPackageManager,
} from "./package-managers";

const installDependencies = () => {
  outputToConsole(
    "Detecting package manager and installing dependencies...",
    "step",
  );

  const packageManager = detectPackageManager();

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
