import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";
import { COLOURS } from "../constants/constants";
import type { TorchRcConfig, TorchRecord } from "../types";

const COMPOSE_FILES = [
  "compose.yaml",
  "compose.yml",
  "docker-compose.yaml",
  "docker-compose.yml",
];

export const DOCKER_FILES = ["Dockerfile", ...COMPOSE_FILES];

function hasComposeFile(): boolean {
  return COMPOSE_FILES.some((file) => fs.existsSync(file));
}

// Returns true when Docker is installed and its daemon is reachable
function dockerIsReady(action: string): boolean {
  if (!hasCmd("docker")) {
    outputToConsole(
      `Docker is not installed - skipping Docker ${action}`,
      "warn",
    );
    return false;
  }

  if (!run("docker info", { silent: true })) {
    outputToConsole(
      `Docker daemon is not running - skipping Docker ${action}`,
      "warn",
    );
    return false;
  }

  return true;
}

function dockerCleanup(
  torchRcConfig: Required<TorchRcConfig>,
): TorchRecord["dockerClean"] {
  if (torchRcConfig.dockerMode === false) {
    outputToConsole(
      "Docker mode disabled - skipping Docker operations",
      "info",
    );
    return "NO_DOCKER";
  }

  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  if (!hasComposeFile()) {
    outputToConsole(
      fs.existsSync("Dockerfile")
        ? "Dockerfile found but no Compose file - Docker mode needs a Compose file, skipping Docker operations"
        : "No Docker configuration found - skipping Docker operations",
      "info",
    );
    return "NO_DOCKER";
  }

  outputToConsole(
    "Stopping Docker services and removing all resources...",
    "info",
  );

  if (!dockerIsReady("cleanup")) {
    return "DOCKER_UNAVAILABLE";
  }

  if (!run("docker compose ps", { silent: true })) {
    outputToConsole(
      "docker compose could not read this project's Compose file - skipping Docker cleanup",
      "fail",
    );
    return "DOCKER_FAIL";
  }

  if (isDryRun) {
    outputToConsole(
      "Dry-run: would run 'docker compose down --rmi all --volumes'",
      "info",
    );
    return "OK";
  }

  if (run("docker compose down --rmi all --volumes")) {
    outputToConsole("Docker services stopped and resources cleaned", "success");
    return "OK";
  }

  outputToConsole("Docker cleanup encountered issues", "warn");
  outputToConsole("Continuing with the rest of the script...", "info");
  return "DOCKER_FAIL";
}

function dockerRebuild(torchRcConfig: Required<TorchRcConfig>) {
  if (torchRcConfig.dockerMode === false) {
    return false;
  }

  if (torchRcConfig.rebuild === false) {
    outputToConsole("Rebuild disabled - skipping Docker rebuild", "info");
    return false;
  }

  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  if (!hasComposeFile()) {
    return false;
  }
  if (!dockerIsReady("rebuild")) {
    outputToConsole(
      "Run 'docker compose build --pull --no-cache' once Docker is available",
      "info",
    );
    return false;
  }

  outputToConsole(
    "Building Docker resources (this may take a while...)...",
    "step",
  );
  console.log(
    `   ${COLOURS.YELLOW("⏳ Please be patient - pulling fresh images and building...")}`,
  );
  if (isDryRun) {
    outputToConsole(
      "Dry-run: would run 'docker compose build --pull --no-cache'",
      "info",
    );
    return true;
  }

  if (!run("docker compose build --pull --no-cache")) {
    outputToConsole("Docker build failed - see the output above", "fail");
    return false;
  }
  return true;
}

function dockerLaunch(torchRcConfig: Required<TorchRcConfig>) {
  if (torchRcConfig.dockerMode === false) {
    return false;
  }

  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  outputToConsole("Starting Docker services in detached mode...", "step");
  if (isDryRun) {
    outputToConsole("Dry-run: would run 'docker compose up -d'", "info");
    return true;
  }
  if (!run("docker compose up -d")) {
    outputToConsole(
      "Failed to start Docker services - see the output above",
      "fail",
    );
    return false;
  }
  return true;
}

export { dockerCleanup, dockerRebuild, dockerLaunch };
