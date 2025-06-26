import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";

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
    return;
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
    return;
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
    return;
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
    return;
  }

  if (run("docker compose down --rmi all --volumes")) {
    outputToConsole("Docker services stopped and resources cleaned", "success");
    return;
  }

  outputToConsole("Docker cleanup encountered issues", "warn");
  outputToConsole("Continuing with the rest of the script...", "info");
  return;
}

export { hasDockerFiles, dockerCleanup };
