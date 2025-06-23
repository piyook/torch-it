#!/usr/bin/env ts-node
"use strict";
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
var child_process_1 = require("child_process");
var path = require("path");
var os = require("os");
var chalk_1 = require("chalk");
var logFile = path.join(process.cwd(), "nuke-it.log");
if (fs.existsSync(logFile))
    fs.unlinkSync(logFile);
var BOLD = chalk_1.default.bold;
var CYAN = chalk_1.default.cyan;
var GREEN = chalk_1.default.green;
var RED = chalk_1.default.red;
var YELLOW = chalk_1.default.yellow;
var PURPLE = chalk_1.default.magenta;
var RESET = chalk_1.default.reset;
var icons = {
    info: "🔍",
    success: "✅",
    fail: "❌",
    warn: "⚠️",
    rocket: "🚀",
    clean: "🧹",
    build: "🔨",
};
function info(msg) {
    console.log("".concat(CYAN(icons.info), " ").concat(BOLD(msg)).concat(RESET("")));
}
function success(msg) {
    console.log("".concat(GREEN(icons.success), " ").concat(msg).concat(RESET("")));
}
function warn(msg) {
    console.log("".concat(YELLOW(icons.warn), " ").concat(msg).concat(RESET("")));
}
function fail(msg) {
    console.log("".concat(RED(icons.fail), " ").concat(msg).concat(RESET("")));
    process.exit(1);
}
function step(msg) {
    console.log("\n".concat(PURPLE("▶"), " ").concat(BOLD(msg)).concat(RESET("")));
}
function run(cmd, opts) {
    if (opts === void 0) { opts = {}; }
    try {
        (0, child_process_1.execSync)(cmd, { stdio: opts.silent ? "pipe" : "inherit" });
        return true;
    }
    catch (e) {
        if (!opts.silent)
            warn("Command failed: ".concat(cmd));
        return false;
    }
}
function hasDockerFiles() {
    return (fs.existsSync("Dockerfile") ||
        fs.existsSync("docker-compose.yml") ||
        fs.existsSync("docker-compose.yaml"));
}
function hasCmd(cmd) {
    try {
        if (os.platform() === "win32") {
            (0, child_process_1.execSync)("where ".concat(cmd), { stdio: "ignore" });
        }
        else {
            (0, child_process_1.execSync)("command -v ".concat(cmd), { stdio: "ignore" });
        }
        return true;
    }
    catch (_a) {
        return false;
    }
}
function printBanner() {
    console.log("          _ ._  _ , _ ._\n" +
        "        (_ ' ( `  )_  .__)\n" +
        "      ( (  (    )   ` )  ) _)\n" +
        "     (__ (_   (_ . _) _) ,__)\n" +
        "         `~~'\\ ' . /'~~`\n" +
        "              ;   ;\n" +
        "              /   \\n" +
        "_____________/_ __ \\_____________\n" +
        "   It's the only way to be sure.\n");
}
function printBox(lines, color) {
    if (color === void 0) { color = chalk_1.default.green; }
    var width = 56;
    var border = color("═".repeat(width));
    console.log(color("╔" + border + "╗"));
    lines.forEach(function (line) {
        if (line.trim() === "") {
            console.log(color("║" + " ".repeat(width) + "║"));
        }
        else {
            var pad = width - line.length;
            console.log(color("║" + line + " ".repeat(pad) + "║"));
        }
    });
    console.log(color("╚" + border + "╝"));
}
// --- Main ---
printBanner();
printBox(["🎯 PROJECT NUKE INITIATED"], chalk_1.default.magenta);
// --- Docker Cleanup ---
step("".concat(icons.clean, " DOCKER CLEANUP"));
if (!hasDockerFiles()) {
    info("No Docker configuration found - skipping Docker operations");
}
else {
    info("Stopping Docker services and removing all resources...");
    if (!hasCmd("docker")) {
        warn("Docker is not installed - skipping Docker cleanup");
    }
    else if (!run("docker info", { silent: true })) {
        warn("Docker daemon is not running - skipping Docker cleanup");
        info("You may need to start Docker manually and run cleanup later");
    }
    else if (!run("docker compose ps", { silent: true })) {
        warn("No Docker Compose services found - skipping Docker cleanup");
        info("This is normal if no services were previously running");
    }
    else {
        if (run("docker compose down --rmi all --volumes")) {
            success("Docker services stopped and resources cleaned");
        }
        else {
            warn("Docker cleanup encountered issues");
            info("Continuing with the rest of the script...");
        }
    }
}
// --- Build/Cache Cleanup ---
step("".concat(icons.clean, " BUILD ARTIFACTS & CACHE CLEANUP"));
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
info("Scanning for build artifacts and cache directories...");
__spreadArray(__spreadArray([], BUILD_DIRS, true), CACHE_DIRS, true).forEach(function (dir) {
    if (fs.existsSync(dir)) {
        info("Removing ".concat(dir, "..."));
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            success("".concat(dir, " removed"));
            removedCount++;
        }
        catch (_a) {
            warn("Failed to remove ".concat(dir));
        }
    }
});
if (removedCount === 0) {
    info("No build artifacts or cache directories found (project already clean)");
}
else {
    success("Removed ".concat(removedCount, " build/cache directories"));
}
// --- Package Manager Cache Cleanup ---
info("Cleaning package manager caches...");
var cacheCleaned = false;
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
step("".concat(icons.build, " DEPENDENCY INSTALLATION"));
info("Detecting package manager and installing dependencies...");
if (fs.existsSync("pnpm-lock.yaml") && hasCmd("pnpm")) {
    info("Using pnpm (detected pnpm-lock.yaml)...");
    if (run("pnpm install"))
        success("Dependencies installed successfully with pnpm");
    else
        fail("pnpm install failed");
}
else if (fs.existsSync("yarn.lock") && hasCmd("yarn")) {
    info("Using yarn (detected yarn.lock)...");
    if (run("yarn install"))
        success("Dependencies installed successfully with yarn");
    else
        fail("yarn install failed");
}
else if (fs.existsSync("package-lock.json") && hasCmd("npm")) {
    info("Using npm (detected package-lock.json)...");
    if (run("npm install"))
        success("Dependencies installed successfully with npm");
    else
        fail("npm install failed");
}
else if (hasCmd("npm")) {
    info("Using npm (fallback)...");
    if (run("npm install"))
        success("Dependencies installed successfully with npm");
    else
        fail("npm install failed");
}
else if (hasCmd("yarn")) {
    info("Using yarn (fallback)...");
    if (run("yarn install"))
        success("Dependencies installed successfully with yarn");
    else
        fail("yarn install failed");
}
else if (hasCmd("pnpm")) {
    info("Using pnpm (fallback)...");
    if (run("pnpm install"))
        success("Dependencies installed successfully with pnpm");
    else
        fail("pnpm install failed");
}
else {
    fail("No package manager found (npm/yarn/pnpm). Please install dependencies manually.");
}
// --- Docker Rebuild ---
step("".concat(icons.build, " DOCKER REBUILD"));
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
    info("Start Docker manually and run 'docker-compose build --pull --no-cache' later");
    printBox([
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
info("Building Docker resources (this may take a while...)...");
console.log("   ".concat(YELLOW("⏳ Please be patient - pulling fresh images and building...")));
if (!run("docker-compose build --pull --no-cache")) {
    fail("Docker build encountered issues - check nuke-it.log for details");
}
// --- Docker Launch ---
step("".concat(icons.rocket, " LAUNCH"));
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
