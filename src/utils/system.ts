import { execSync } from "child_process";
import type { StdioOptions } from "child_process";
import * as os from "os";
import { isQuiet, outputToConsole } from "./ui";

// With --quiet a command keeps its errors but loses its progress output
const commandStdio = (): StdioOptions =>
  isQuiet() ? ["inherit", "ignore", "inherit"] : "inherit";

function run(cmd: string, opts: { silent?: boolean } = {}): boolean {
  try {
    execSync(cmd, { stdio: opts.silent ? "pipe" : commandStdio() });
    return true;
  } catch {
    if (!opts.silent) outputToConsole(`Command failed: ${cmd}`, "fail");
    return false;
  }
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

export { run, hasCmd };
