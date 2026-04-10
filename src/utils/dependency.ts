import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";

const installDependencies = () => {
  let installed = false;
  outputToConsole(
    "Detecting package manager and installing dependencies...",
    "step"
  );
  if (fs.existsSync("pnpm-lock.yaml") && hasCmd("pnpm")) {
    outputToConsole("Using pnpm (detected pnpm-lock.yaml)...", "step");
    if (run("pnpm install")) {
      outputToConsole(
        "Dependencies installed successfully with pnpm",
        "success"
      );
      installed = true;
    } else outputToConsole("pnpm install failed", "fail");
  } else if (fs.existsSync("yarn.lock") && hasCmd("yarn")) {
    outputToConsole("Using yarn (detected yarn.lock)...", "step");
    if (run("yarn install")) {
      outputToConsole(
        "Dependencies installed successfully with yarn",
        "success"
      );
      installed = true;
    } else outputToConsole("yarn install failed", "fail");
  } else if (fs.existsSync("package-lock.json") && hasCmd("npm")) {
    outputToConsole("Using npm (detected package-lock.json)...", "step");
    if (run("npm install")) {
      outputToConsole(
        "Dependencies installed successfully with npm",
        "success"
      );
      installed = true;
    } else outputToConsole("npm install failed", "fail");
  } else if (hasCmd("npm")) {
    outputToConsole("Using npm (fallback)...", "info");
    if (run("npm install")) {
      outputToConsole(
        "Dependencies installed successfully with npm",
        "success"
      );
      installed = true;
    } else outputToConsole("npm install failed", "fail");
  } else if (hasCmd("yarn")) {
    outputToConsole("Using yarn (fallback)...", "info");
    if (run("yarn install")) {
      outputToConsole(
        "Dependencies installed successfully with yarn",
        "success"
      );
      installed = true;
    } else outputToConsole("yarn install failed", "");
  } else if (hasCmd("pnpm")) {
    outputToConsole("Using pnpm (fallback)...", "info");
    if (run("pnpm install")) {
      outputToConsole(
        "Dependencies installed successfully with pnpm",
        "success"
      );
      installed = true;
    } else outputToConsole("pnpm install failed", "fail");
  } else {
    outputToConsole(
      "No package manager found (npm/yarn/pnpm). Please install dependencies manually.",
      "fail"
    );
  }

  return installed;
};

export { installDependencies };
