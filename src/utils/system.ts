import { execSync } from "child_process";
import * as os from "os";
import { warn } from "./ui";

function run(cmd: string, opts: { silent?: boolean } = {}): boolean {
  try {
    execSync(cmd, { stdio: opts.silent ? "pipe" : "inherit" });
    return true;
  } catch (e) {
    if (!opts.silent) warn(`Command failed: ${cmd}`);
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
