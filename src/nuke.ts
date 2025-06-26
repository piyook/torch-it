#!/usr/bin/env ts-node

import * as fs from "fs";
import chalk from "chalk";

import { hasDockerFiles } from "./utils/docker";
import { hasCmd, run } from "./utils/system";
import { printBanner, printBox, outputToConsole } from "./utils/ui";
import { ICONS, COLOURS } from "./constants/constants";
import { BUILD_DIRS, CACHE_DIRS } from "./constants/config";

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

// --- Main ---
printBox(
  [`                    ${ICONS.TARGET} NUKE LAUNCHED ${ICONS.ROCKET}`],
  chalk.magenta
);
printBanner();

// --- Docker Cleanup ---
outputToConsole(`${ICONS.CLEAN} DOCKER CLEANUP`, "step");
dockerCleanup();

// --- Build/Cache Cleanup ---
outputToConsole(`${ICONS.CLEAN} BUILD ARTIFACTS & CACHE CLEANUP`, "step");

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
if (removedCount === 0) {
  outputToConsole(
    "No build artifacts or cache directories found (project already clean)",
    "info"
  );
} else {
  outputToConsole(`Removed ${removedCount} build/cache directories`, "success");
}

// --- Package Manager Cache Cleanup ---
outputToConsole("Cleaning package manager caches...", "step");
let cacheCleaned = false;
if (hasCmd("npm")) {
  if (run("npm cache clean --force")) {
    outputToConsole("npm cache cleaned", "success");
    cacheCleaned = true;
  }
}
if (hasCmd("yarn")) {
  if (run("yarn cache clean")) {
    outputToConsole("yarn cache cleaned", "success");
    cacheCleaned = true;
  }
}
if (hasCmd("pnpm")) {
  if (run("pnpm store prune")) {
    outputToConsole("pnpm store cleaned", "success");
    cacheCleaned = true;
  }
}
if (!cacheCleaned)
  outputToConsole(
    "No package manager caches cleaned (tools not available)",
    "info"
  );

// --- Dependency Installation ---
// TODO: tidy-up code and remove nested if statements
outputToConsole(`${ICONS.BUILD} DEPENDENCY INSTALLATION`, "step");
outputToConsole(
  "Detecting package manager and installing dependencies...",
  "step"
);
if (fs.existsSync("pnpm-lock.yaml") && hasCmd("pnpm")) {
  outputToConsole("Using pnpm (detected pnpm-lock.yaml)...", "step");
  if (run("pnpm install"))
    outputToConsole("Dependencies installed successfully with pnpm", "success");
  else outputToConsole("pnpm install failed", "fail");
} else if (fs.existsSync("yarn.lock") && hasCmd("yarn")) {
  outputToConsole("Using yarn (detected yarn.lock)...", "step");
  if (run("yarn install"))
    outputToConsole("Dependencies installed successfully with yarn", "success");
  else outputToConsole("yarn install failed", "fail");
} else if (fs.existsSync("package-lock.json") && hasCmd("npm")) {
  outputToConsole("Using npm (detected package-lock.json)...", "step");
  if (run("npm install"))
    outputToConsole("Dependencies installed successfully with npm", "success");
  else outputToConsole("npm install failed", "fail");
} else if (hasCmd("npm")) {
  outputToConsole("Using npm (fallback)...", "info");
  if (run("npm install"))
    outputToConsole("Dependencies installed successfully with npm", "success");
  else outputToConsole("npm install failed", "fail");
} else if (hasCmd("yarn")) {
  outputToConsole("Using yarn (fallback)...", "info");
  if (run("yarn install"))
    outputToConsole("Dependencies installed successfully with yarn", "success");
  else outputToConsole("yarn install failed", "");
} else if (hasCmd("pnpm")) {
  outputToConsole("Using pnpm (fallback)...", "info");
  if (run("pnpm install"))
    outputToConsole("Dependencies installed successfully with pnpm", "success");
  else outputToConsole("pnpm install failed", "fail");
} else {
  outputToConsole(
    "No package manager found (npm/yarn/pnpm). Please install dependencies manually.",
    "fail"
  );
}

// --- Docker Rebuild ---
outputToConsole(`${ICONS.BUILD} DOCKER REBUILD`, "step");
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
  outputToConsole("Docker is not installed - skipping Docker rebuild", "warn");
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
    chalk.yellow
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

// --- Docker Launch ---
outputToConsole(`${ICONS.ROCKET} LAUNCH`, "step");
outputToConsole("Starting Docker services in detached mode...", "step");
if (!run("docker compose up -d")) {
  outputToConsole(
    "Failed to start Docker services - check nuke-it.log for details",
    "fail"
  );
}

// --- Final Success Message ---
printBox([
  "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
  "",
  "✨ All build artifacts & caches removed",
  "🐳 Docker containers rebuilt from scratch",
  "📦 Dependencies freshly installed",
  "🚀 Services running in detached mode",
  "",
  "📋 Check nuke-it.log for detailed logs",
]);
