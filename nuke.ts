#!/usr/bin/env ts-node

import * as fs from "fs";
import { execSync } from "child_process";
import * as path from "path";
import * as os from "os";
import chalk from "chalk";

const logFile = path.join(process.cwd(), "nuke-it.log");
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const BOLD = chalk.bold;
const CYAN = chalk.cyan;
const GREEN = chalk.green;
const RED = chalk.red;
const YELLOW = chalk.yellow;
const PURPLE = chalk.magenta;
const RESET = chalk.reset;

const icons = {
  info: "🔍",
  success: "✅",
  fail: "❌",
  warn: "⚠️",
  rocket: "🚀",
  clean: "🧹",
  build: "🔨",
};

function info(msg: string) {
  console.log(`${CYAN(icons.info)} ${BOLD(msg)}${RESET("")}`);
}
function success(msg: string) {
  console.log(`${GREEN(icons.success)} ${msg}${RESET("")}`);
}
function warn(msg: string) {
  console.log(`${YELLOW(icons.warn)} ${msg}${RESET("")}`);
}
function fail(msg: string) {
  console.log(`${RED(icons.fail)} ${msg}${RESET("")}`);
  process.exit(1);
}
function step(msg: string) {
  console.log(`\n${PURPLE("▶")} ${BOLD(msg)}${RESET("")}`);
}

function run(cmd: string, opts: { silent?: boolean } = {}): boolean {
  try {
    execSync(cmd, { stdio: opts.silent ? "pipe" : "inherit" });
    return true;
  } catch (e) {
    if (!opts.silent) warn(`Command failed: ${cmd}`);
    return false;
  }
}

function hasDockerFiles(): boolean {
  return (
    fs.existsSync("Dockerfile") ||
    fs.existsSync("docker-compose.yml") ||
    fs.existsSync("docker-compose.yaml")
  );
}

function hasCmd(cmd: string): boolean {
  try {
    if (os.platform() === "win32") {
      execSync(`where ${cmd}`, { stdio: "ignore" });
    } else {
      execSync(`command -v ${cmd}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

function printBanner(): void {
  console.log(
    "          _ ._  _ , _ ._\n" +
      "        (_ ' ( `  )_  .__)\n" +
      "      ( (  (    )   ` )  ) _)\n" +
      "     (__ (_   (_ . _) _) ,__)\n" +
      "         `~~'\\ ' . /'~~`\n" +
      "              ;   ;\n" +
      "              /   \\n" +
      "_____________/_ __ \\_____________\n" +
      "   It's the only way to be sure.\n"
  );
}

function printBox(lines: string[], color: typeof chalk = chalk.green): void {
  const width = 56;
  const border = color("═".repeat(width));
  console.log(color("╔" + border + "╗"));
  lines.forEach((line) => {
    if (line.trim() === "") {
      console.log(color("║" + " ".repeat(width) + "║"));
    } else {
      const pad = width - line.length;
      console.log(color("║" + line + " ".repeat(pad) + "║"));
    }
  });
  console.log(color("╚" + border + "╝"));
}

// --- Main ---
printBanner();
printBox(["🎯 PROJECT NUKE INITIATED"], chalk.magenta);

// --- Docker Cleanup ---
step(`${icons.clean} DOCKER CLEANUP`);
if (!hasDockerFiles()) {
  info("No Docker configuration found - skipping Docker operations");
} else {
  info("Stopping Docker services and removing all resources...");
  if (!hasCmd("docker")) {
    warn("Docker is not installed - skipping Docker cleanup");
  } else if (!run("docker info", { silent: true })) {
    warn("Docker daemon is not running - skipping Docker cleanup");
    info("You may need to start Docker manually and run cleanup later");
  } else if (!run("docker compose ps", { silent: true })) {
    warn("No Docker Compose services found - skipping Docker cleanup");
    info("This is normal if no services were previously running");
  } else {
    if (run("docker compose down --rmi all --volumes")) {
      success("Docker services stopped and resources cleaned");
    } else {
      warn("Docker cleanup encountered issues");
      info("Continuing with the rest of the script...");
    }
  }
}

// --- Build/Cache Cleanup ---
step(`${icons.clean} BUILD ARTIFACTS & CACHE CLEANUP`);
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
step(`${icons.build} DEPENDENCY INSTALLATION`);
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
step(`${icons.build} DOCKER REBUILD`);
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
  `   ${YELLOW("⏳ Please be patient - pulling fresh images and building...")}`
);
if (!run("docker-compose build --pull --no-cache")) {
  fail("Docker build encountered issues - check nuke-it.log for details");
}

// --- Docker Launch ---
step(`${icons.rocket} LAUNCH`);
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
