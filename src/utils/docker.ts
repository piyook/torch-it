import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";
import { printBox } from "./ui";
import { COLOURS, ICONS } from "../constants/constants";

function hasDockerFiles(): boolean {
  return (
    fs.existsSync("Dockerfile") ||
    fs.existsSync("docker-compose.yml") ||
    fs.existsSync("docker-compose.yaml")
  );
}

function dockerCleanup() {
  if (!hasDockerFiles()) {
    outputToConsole(
      "No Docker configuration found - skipping Docker operations",
      "info"
    );
    return "NO_DOCKER";
  }

  outputToConsole(
    "Stopping Docker services and removing all resources...",
    "info"
  );

  if (!hasCmd("docker")) {
    outputToConsole(
      "Docker is not installed - skipping Docker cleanup",
      "warn"
    );
    return "NO_DOCKER";
  }

  if (!run("docker info", { silent: true })) {
    outputToConsole(
      "Docker daemon is not running - skipping Docker cleanup",
      "warn"
    );
    outputToConsole(
      "You may need to start Docker manually and run cleanup later",
      "info"
    );
    return "NO_DOCKER";
  }
  if (!run("docker compose ps", { silent: true })) {
    outputToConsole(
      "No Docker Compose services found - skipping Docker cleanup",
      "warn"
    );
    outputToConsole(
      "This is normal if no services were previously running",
      "info"
    );
    return "DOCKER_FAIL";
  }

  if (run("docker compose down --rmi all --volumes")) {
    outputToConsole("Docker services stopped and resources cleaned", "success");
    return "OK";
  }

  outputToConsole("Docker cleanup encountered issues", "warn");
  outputToConsole("Continuing with the rest of the script...", "info");
  return "DOCKER_FAIL";
}

function dockerRebuild() {
  if (!hasDockerFiles()) {
    return false;
  }
  if (!hasCmd("docker")) {
    outputToConsole(
      "Docker is not installed - skipping Docker rebuild",
      "warn"
    );
    return false;
  }
  if (!run("docker info", { silent: true })) {
    outputToConsole(
      "Docker daemon is not running - skipping Docker rebuild",
      "warn"
    );
    outputToConsole(
      "Start Docker manually and run 'docker-compose build --pull --no-cache' later",
      "info"
    );
    return false;
  }

  outputToConsole(
    "Building Docker resources (this may take a while...)...",
    "step"
  );
  console.log(
    `   ${COLOURS.YELLOW(
      "⏳ Please be patient - pulling fresh images and building..."
    )}`
  );
  if (!run("docker-compose build --pull --no-cache")) {
    outputToConsole(
      "Docker build encountered issues - check nuke-it.log for details",
      "fail"
    );
    return false;
  }
  return true;
}

function dockerLaunch() {
  outputToConsole("Starting Docker services in detached mode...", "step");
  if (!run("docker compose up -d")) {
    outputToConsole(
      "Failed to start Docker services - check nuke-it.log for details",
      "fail"
    );
    return false;
  }
  return true;
}

export { hasDockerFiles, dockerCleanup, dockerRebuild, dockerLaunch };
