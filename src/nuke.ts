#!/usr/bin/env ts-node

// TODO: Add a logging to file functionality

import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

import { hasDockerFiles } from "./utils/docker";
import { hasCmd, run } from "./utils/system";
import {
  info,
  success,
  warn,
  fail,
  step,
  printBanner,
  printBox,
} from "./utils/ui";
import { ICONS, COLOURS } from "./constants/constants";

const logFile = path.join(process.cwd(), "nuke-it.log");
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

function dockerCleanup() {
  if (!hasDockerFiles()) {
    info("No Docker configuration found - skipping Docker operations");
    return;
  }

  info("Stopping Docker services and removing all resources...");

  if (!hasCmd("docker")) {
    warn("Docker is not installed - skipping Docker cleanup");
    return;
  }
  if (!run("docker info", { silent: true })) {
    warn("Docker daemon is not running - skipping Docker cleanup");
    info("You may need to start Docker manually and run cleanup later");
    return;
  }
  if (!run("docker compose ps", { silent: true })) {
    warn("No Docker Compose services found - skipping Docker cleanup");
    info("This is normal if no services were previously running");
    return;
  }

  if (run("docker compose down --rmi all --volumes")) {
    success("Docker services stopped and resources cleaned");
    return;
  }
  warn("Docker cleanup encountered issues");
  info("Continuing with the rest of the script...");
  return;
}

// --- Main ---
printBox(["   🎯 NUKE PROJECT INITIATED"], chalk.magenta);
printBanner();

// --- Docker Cleanup ---
step(`${ICONS.CLEAN} DOCKER CLEANUP`);
dockerCleanup();

// --- Build/Cache Cleanup ---
step(`${ICONS.CLEAN} BUILD ARTIFACTS & CACHE CLEANUP`);
const BUILD_DIRS = [
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "out",
  ".output",
  ".vite",
  ".cache",
  ".parcel-cache",
  ".webpack",
  "coverage",
  ".nyc_output",
  "storybook-static",
  ".storybook-out",
  ".turbo",
  ".rush",
  "lib",
  "es",
  "cjs",
  "umd",
];
const CACHE_DIRS = [
  ".pnpm-store",
  ".yarn/cache",
  ".npm",
  "node_modules/.cache",
];
let removedCount = 0;
info("Scanning for build artifacts and cache directories...");
[...BUILD_DIRS, ...CACHE_DIRS].forEach((dir) => {
  if (fs.existsSync(dir)) {
    info(`Removing ${dir}...`);
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      success(`${dir} removed`);
      removedCount++;
    } catch {
      warn(`Failed to remove ${dir}`);
    }
  }
});
if (removedCount === 0) {
  info("No build artifacts or cache directories found (project already clean)");
} else {
  success(`Removed ${removedCount} build/cache directories`);
}

// --- Package Manager Cache Cleanup ---
info("Cleaning package manager caches...");
let cacheCleaned = false;
if (hasCmd("npm")) {
  if (run("npm cache clean --force")) {
    success("npm cache cleaned");
    cacheCleaned = true;
  }
}
if (hasCmd("yarn")) {
  if (run("yarn cache clean")) {
    success("yarn cache cleaned");
    cacheCleaned = true;
  }
}
if (hasCmd("pnpm")) {
  if (run("pnpm store prune")) {
    success("pnpm store cleaned");
    cacheCleaned = true;
  }
}
if (!cacheCleaned)
  info("No package manager caches cleaned (tools not available)");

// --- Dependency Installation ---
// TODO: tidy-up code and remove nested if statements
step(`${ICONS.BUILD} DEPENDENCY INSTALLATION`);
info("Detecting package manager and installing dependencies...");
if (fs.existsSync("pnpm-lock.yaml") && hasCmd("pnpm")) {
  info("Using pnpm (detected pnpm-lock.yaml)...");
  if (run("pnpm install"))
    success("Dependencies installed successfully with pnpm");
  else fail("pnpm install failed");
} else if (fs.existsSync("yarn.lock") && hasCmd("yarn")) {
  info("Using yarn (detected yarn.lock)...");
  if (run("yarn install"))
    success("Dependencies installed successfully with yarn");
  else fail("yarn install failed");
} else if (fs.existsSync("package-lock.json") && hasCmd("npm")) {
  info("Using npm (detected package-lock.json)...");
  if (run("npm install"))
    success("Dependencies installed successfully with npm");
  else fail("npm install failed");
} else if (hasCmd("npm")) {
  info("Using npm (fallback)...");
  if (run("npm install"))
    success("Dependencies installed successfully with npm");
  else fail("npm install failed");
} else if (hasCmd("yarn")) {
  info("Using yarn (fallback)...");
  if (run("yarn install"))
    success("Dependencies installed successfully with yarn");
  else fail("yarn install failed");
} else if (hasCmd("pnpm")) {
  info("Using pnpm (fallback)...");
  if (run("pnpm install"))
    success("Dependencies installed successfully with pnpm");
  else fail("pnpm install failed");
} else {
  fail(
    "No package manager found (npm/yarn/pnpm). Please install dependencies manually."
  );
}

// --- Docker Rebuild ---
step(`${ICONS.BUILD} DOCKER REBUILD`);
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
  warn("Docker is not installed - skipping Docker rebuild");
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
  warn("Docker daemon is not running - skipping Docker rebuild");
  info(
    "Start Docker manually and run 'docker-compose build --pull --no-cache' later"
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

info("Building Docker resources (this may take a while...)...");
console.log(
  `   ${COLOURS.YELLOW(
    "⏳ Please be patient - pulling fresh images and building..."
  )}`
);
if (!run("docker-compose build --pull --no-cache")) {
  fail("Docker build encountered issues - check nuke-it.log for details");
}

// --- Docker Launch ---
step(`${ICONS.ROCKET} LAUNCH`);
info("Starting Docker services in detached mode...");
if (!run("docker compose up -d")) {
  fail("Failed to start Docker services - check nuke-it.log for details");
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
