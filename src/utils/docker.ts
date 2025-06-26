import * as fs from "fs";
import { outputToConsole } from "./ui";
import { hasCmd, run } from "./system";
import { printBox } from "./ui";
import { COLOURS } from "../constants/constants";

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

function dockerRebuild() {
  if (!hasDockerFiles()) {
    printBox([
      "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
      "",
      "✨ All build artifacts & caches removed",
      "📦 Dependencies freshly installed",
      "",
      "📋 Check nuke-it.log for detailed logs",
    ]);
    process.exit(0);
  }
  if (!hasCmd("docker")) {
    outputToConsole(
      "Docker is not installed - skipping Docker rebuild",
      "warn"
    );
    printBox([
      "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
      "",
      "✨ All build artifacts & caches removed",
      "📦 Dependencies freshly installed",
      "",
      "📋 Check nuke-it.log for detailed logs",
    ]);
    process.exit(0);
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
    printBox(
      [
        "🎯 PARTIAL NUKE COMPLETED! 🎯",
        "",
        "✅ Build artifacts & caches removed",
        "✅ Dependencies freshly installed",
        "⚠️  Docker services skipped (Docker not running)",
        "",
        "📋 Check nuke-it.log for detailed logs",
        "🐳 Start Docker and run rebuild commands manually",
      ],
      COLOURS.YELLOW
    );
    process.exit(0);
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
  }
}

function dockerLaunch() {
  outputToConsole("Starting Docker services in detached mode...", "step");
  if (!run("docker compose up -d")) {
    outputToConsole(
      "Failed to start Docker services - check nuke-it.log for details",
      "fail"
    );
  }
}

export { hasDockerFiles, dockerCleanup, dockerRebuild, dockerLaunch };
