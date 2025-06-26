#!/usr/bin/env ts-node
"use strict";
// TODO: Add a logging to file functionality
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var chalk_1 = require("chalk");
var docker_1 = require("./utils/docker");
var system_1 = require("./utils/system");
var ui_1 = require("./utils/ui");
var constants_1 = require("./constants/constants");
var logFile = path.join(process.cwd(), "nuke-it.log");
if (fs.existsSync(logFile))
    fs.unlinkSync(logFile);
function dockerCleanup() {
    if (!(0, docker_1.hasDockerFiles)()) {
        (0, ui_1.info)("No Docker configuration found - skipping Docker operations");
        return;
    }
    (0, ui_1.info)("Stopping Docker services and removing all resources...");
    if (!(0, system_1.hasCmd)("docker")) {
        (0, ui_1.warn)("Docker is not installed - skipping Docker cleanup");
        return;
    }
    if (!(0, system_1.run)("docker info", { silent: true })) {
        (0, ui_1.warn)("Docker daemon is not running - skipping Docker cleanup");
        (0, ui_1.info)("You may need to start Docker manually and run cleanup later");
        return;
    }
    if (!(0, system_1.run)("docker compose ps", { silent: true })) {
        (0, ui_1.warn)("No Docker Compose services found - skipping Docker cleanup");
        (0, ui_1.info)("This is normal if no services were previously running");
        return;
    }
    if ((0, system_1.run)("docker compose down --rmi all --volumes")) {
        (0, ui_1.success)("Docker services stopped and resources cleaned");
        return;
    }
    (0, ui_1.warn)("Docker cleanup encountered issues");
    (0, ui_1.info)("Continuing with the rest of the script...");
    return;
}
// --- Main ---
(0, ui_1.printBox)(["   🎯 NUKE PROJECT INITIATED"], chalk_1.default.magenta);
(0, ui_1.printBanner)();
// --- Docker Cleanup ---
(0, ui_1.step)("".concat(constants_1.ICONS.CLEAN, " DOCKER CLEANUP"));
dockerCleanup();
// --- Build/Cache Cleanup ---
(0, ui_1.step)("".concat(constants_1.ICONS.CLEAN, " BUILD ARTIFACTS & CACHE CLEANUP"));
var BUILD_DIRS = [
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
var CACHE_DIRS = [
    ".pnpm-store",
    ".yarn/cache",
    ".npm",
    "node_modules/.cache",
];
var removedCount = 0;
(0, ui_1.info)("Scanning for build artifacts and cache directories...");
__spreadArray(__spreadArray([], BUILD_DIRS, true), CACHE_DIRS, true).forEach(function (dir) {
    if (fs.existsSync(dir)) {
        (0, ui_1.info)("Removing ".concat(dir, "..."));
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            (0, ui_1.success)("".concat(dir, " removed"));
            removedCount++;
        }
        catch (_a) {
            (0, ui_1.warn)("Failed to remove ".concat(dir));
        }
    }
});
if (removedCount === 0) {
    (0, ui_1.info)("No build artifacts or cache directories found (project already clean)");
}
else {
    (0, ui_1.success)("Removed ".concat(removedCount, " build/cache directories"));
}
// --- Package Manager Cache Cleanup ---
(0, ui_1.info)("Cleaning package manager caches...");
var cacheCleaned = false;
if ((0, system_1.hasCmd)("npm")) {
    if ((0, system_1.run)("npm cache clean --force")) {
        (0, ui_1.success)("npm cache cleaned");
        cacheCleaned = true;
    }
}
if ((0, system_1.hasCmd)("yarn")) {
    if ((0, system_1.run)("yarn cache clean")) {
        (0, ui_1.success)("yarn cache cleaned");
        cacheCleaned = true;
    }
}
if ((0, system_1.hasCmd)("pnpm")) {
    if ((0, system_1.run)("pnpm store prune")) {
        (0, ui_1.success)("pnpm store cleaned");
        cacheCleaned = true;
    }
}
if (!cacheCleaned)
    (0, ui_1.info)("No package manager caches cleaned (tools not available)");
// --- Dependency Installation ---
// TODO: tidy-up code and remove nested if statements
(0, ui_1.step)("".concat(constants_1.ICONS.BUILD, " DEPENDENCY INSTALLATION"));
(0, ui_1.info)("Detecting package manager and installing dependencies...");
if (fs.existsSync("pnpm-lock.yaml") && (0, system_1.hasCmd)("pnpm")) {
    (0, ui_1.info)("Using pnpm (detected pnpm-lock.yaml)...");
    if ((0, system_1.run)("pnpm install"))
        (0, ui_1.success)("Dependencies installed successfully with pnpm");
    else
        (0, ui_1.fail)("pnpm install failed");
}
else if (fs.existsSync("yarn.lock") && (0, system_1.hasCmd)("yarn")) {
    (0, ui_1.info)("Using yarn (detected yarn.lock)...");
    if ((0, system_1.run)("yarn install"))
        (0, ui_1.success)("Dependencies installed successfully with yarn");
    else
        (0, ui_1.fail)("yarn install failed");
}
else if (fs.existsSync("package-lock.json") && (0, system_1.hasCmd)("npm")) {
    (0, ui_1.info)("Using npm (detected package-lock.json)...");
    if ((0, system_1.run)("npm install"))
        (0, ui_1.success)("Dependencies installed successfully with npm");
    else
        (0, ui_1.fail)("npm install failed");
}
else if ((0, system_1.hasCmd)("npm")) {
    (0, ui_1.info)("Using npm (fallback)...");
    if ((0, system_1.run)("npm install"))
        (0, ui_1.success)("Dependencies installed successfully with npm");
    else
        (0, ui_1.fail)("npm install failed");
}
else if ((0, system_1.hasCmd)("yarn")) {
    (0, ui_1.info)("Using yarn (fallback)...");
    if ((0, system_1.run)("yarn install"))
        (0, ui_1.success)("Dependencies installed successfully with yarn");
    else
        (0, ui_1.fail)("yarn install failed");
}
else if ((0, system_1.hasCmd)("pnpm")) {
    (0, ui_1.info)("Using pnpm (fallback)...");
    if ((0, system_1.run)("pnpm install"))
        (0, ui_1.success)("Dependencies installed successfully with pnpm");
    else
        (0, ui_1.fail)("pnpm install failed");
}
else {
    (0, ui_1.fail)("No package manager found (npm/yarn/pnpm). Please install dependencies manually.");
}
// --- Docker Rebuild ---
(0, ui_1.step)("".concat(constants_1.ICONS.BUILD, " DOCKER REBUILD"));
if (!(0, docker_1.hasDockerFiles)()) {
    (0, ui_1.printBox)([
        "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
        "",
        "✨ All build artifacts & caches removed",
        "📦 Dependencies freshly installed",
        "",
        "📋 Check nuke-it.log for detailed logs",
    ]);
    process.exit(0);
}
if (!(0, system_1.hasCmd)("docker")) {
    (0, ui_1.warn)("Docker is not installed - skipping Docker rebuild");
    (0, ui_1.printBox)([
        "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
        "",
        "✨ All build artifacts & caches removed",
        "📦 Dependencies freshly installed",
        "",
        "📋 Check nuke-it.log for detailed logs",
    ]);
    process.exit(0);
}
if (!(0, system_1.run)("docker info", { silent: true })) {
    (0, ui_1.warn)("Docker daemon is not running - skipping Docker rebuild");
    (0, ui_1.info)("Start Docker manually and run 'docker-compose build --pull --no-cache' later");
    (0, ui_1.printBox)([
        "🎯 PARTIAL NUKE COMPLETED! 🎯",
        "",
        "✅ Build artifacts & caches removed",
        "✅ Dependencies freshly installed",
        "⚠️  Docker services skipped (Docker not running)",
        "",
        "📋 Check nuke-it.log for detailed logs",
        "🐳 Start Docker and run rebuild commands manually",
    ], chalk_1.default.yellow);
    process.exit(0);
}
(0, ui_1.info)("Building Docker resources (this may take a while...)...");
console.log("   ".concat(constants_1.COLOURS.YELLOW("⏳ Please be patient - pulling fresh images and building...")));
if (!(0, system_1.run)("docker-compose build --pull --no-cache")) {
    (0, ui_1.fail)("Docker build encountered issues - check nuke-it.log for details");
}
// --- Docker Launch ---
(0, ui_1.step)("".concat(constants_1.ICONS.ROCKET, " LAUNCH"));
(0, ui_1.info)("Starting Docker services in detached mode...");
if (!(0, system_1.run)("docker compose up -d")) {
    (0, ui_1.fail)("Failed to start Docker services - check nuke-it.log for details");
}
// --- Final Success Message ---
(0, ui_1.printBox)([
    "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
    "",
    "✨ All build artifacts & caches removed",
    "🐳 Docker containers rebuilt from scratch",
    "📦 Dependencies freshly installed",
    "🚀 Services running in detached mode",
    "",
    "📋 Check nuke-it.log for detailed logs",
]);
