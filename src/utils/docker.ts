import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";
import { COLOURS } from "../constants/constants";
import type { TorchRcConfig } from "../types";

function hasDockerFiles(): boolean {
  return (
    fs.existsSync("Dockerfile") ||
    fs.existsSync("docker-compose.yml") ||
    fs.existsSync("docker-compose.yaml")
  );
}

function dockerCleanup(torchRcConfig: Required<TorchRcConfig>) {
  if (torchRcConfig.dockerMode === false) {
    outputToConsole(
      "Docker mode disabled - skipping Docker operations",
      "info",
    );
    return "NO_DOCKER";
  }

  const isDryRun = process.env.TORCH_DRY_RUN === "1";
  if (!hasDockerFiles()) {
    outputToConsole(
      "No Docker configuration found - skipping Docker operations",
      "info",
    );
    return "NO_DOCKER";
  }

  outputToConsole(
    "Stopping Docker services and removing all resources...",
    "info",
  );

  if (!hasCmd("docker")) {
    outputToConsole(
      "Docker is not installed - skipping Docker cleanup",
      "warn",
    );
    return "NO_DOCKER";
  }

  if (!run("docker info", { silent: true })) {
    outputToConsole(
      "Docker daemon is not running - skipping Docker cleanup",
      "warn",
    );
    outputToConsole(
      "You may need to start Docker manually and run cleanup later",
      "info",
    );
    return "NO_DOCKER";
  }
  if (!run("docker compose ps", { silent: true })) {
    outputToConsole(
      "No Docker Compose services found - skipping Docker cleanup",
      "warn",
    );
    outputToConsole(
      "This is normal if no services were previously running",
      "info",
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
  if (!hasDockerFiles()) {
    return false;
  }
  if (!hasCmd("docker")) {
    outputToConsole(
      "Docker is not installed - skipping Docker rebuild",
      "warn",
    );
    return false;
  }
  if (!run("docker info", { silent: true })) {
    outputToConsole(
      "Docker daemon is not running - skipping Docker rebuild",
      "warn",
    );
    outputToConsole(
      "Start Docker manually and run 'docker-compose build --pull --no-cache' later",
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
      "Dry-run: would run 'docker-compose build --pull --no-cache'",
      "info",
    );
    return true;
  }

  if (!run("docker-compose build --pull --no-cache")) {
    outputToConsole(
      "Docker build encountered issues - check torch-it.log for details",
      "fail",
    );
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
      "Failed to start Docker services - check torch-it.log for details",
      "fail",
    );
    return false;
  }
  return true;
}

export { hasDockerFiles, dockerCleanup, dockerRebuild, dockerLaunch };
