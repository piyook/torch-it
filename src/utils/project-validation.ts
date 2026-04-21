import * as fs from "fs";
import * as path from "path";
import { outputToConsole } from "./ui";

/**
 * Checks if the current directory contains a Node.js project
 * by looking for package.json, yarn.lock, pnpm-lock.yaml, or npm-shrinkwrap.json
 */
export function isNodeProject(): boolean {
  const requiredFiles = [
    "package.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "npm-shrinkwrap.json",
  ];

  return requiredFiles.some((file) =>
    fs.existsSync(path.join(process.cwd(), file)),
  );
}

/**
 * Validates that the current directory is a Node.js project
 * If not, displays an error message and exits the process
 */
export function validateNodeProject(): void {
  if (!isNodeProject()) {
    outputToConsole(
      "This directory does not contain a Node.js project.",
      "fail",
    );
    outputToConsole(
      "Please create a Node.js project (with package.json) before using torch-it.",
      "info",
    );
    process.exit(1);
  }
}
