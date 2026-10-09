import { setLoggerEnabled } from "./logger";
import { outputToConsole } from "./ui";
import { showHelp } from "./help";
import { showConfig } from "./config-display";
import { getTorchRcConfig } from "./torchrc";
import { EXIT } from "../constants/constants";

interface CliFlags {
  isHelp: boolean;
  isVersion: boolean;
  isConfig: boolean;
  isDryRun: boolean;
  assumeYes: boolean;
  isQuiet: boolean;
  isPlain: boolean;
}

export interface CliArgs extends CliFlags {
  // Directory to run in, from --cwd. Undefined when the flag was not given.
  cwd?: string;
  filteredArgs: string[];
}

const FLAGS: Record<string, keyof CliFlags> = {
  "--help": "isHelp",
  "-h": "isHelp",
  "--version": "isVersion",
  "-v": "isVersion",
  "--config": "isConfig",
  "--test": "isDryRun",
  "--yes": "assumeYes",
  "-y": "assumeYes",
  "--quiet": "isQuiet",
  "-q": "isQuiet",
  "--plain": "isPlain",
};

export function parseCliArgs(args: string[]): CliArgs {
  const parsed: CliArgs = {
    isHelp: false,
    isVersion: false,
    isConfig: false,
    isDryRun: false,
    assumeYes: false,
    isQuiet: false,
    isPlain: false,
    filteredArgs: [],
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const flag = FLAGS[arg];
    if (flag) {
      parsed[flag] = true;
    } else if (arg === "--cwd") {
      // "--cwd dir": the directory is the next argument
      parsed.cwd = args[++index] ?? "";
    } else if (arg.startsWith("--cwd=")) {
      parsed.cwd = arg.slice("--cwd=".length);
    } else {
      // Everything else is a config override, checked by the config parser
      parsed.filteredArgs.push(arg);
    }
  }

  return parsed;
}

// Moves to the --cwd directory before anything reads the project
export function applyWorkingDirectory(args: CliArgs): void {
  if (args.cwd === undefined) return;

  try {
    process.chdir(args.cwd);
  } catch {
    outputToConsole(
      args.cwd === ""
        ? "--cwd needs a directory"
        : `--cwd: cannot use "${args.cwd}" as the working directory`,
      "fail",
    );
    process.exit(EXIT.ERROR);
  }
}

export function handleSpecialFlags(args: CliArgs): void {
  if (args.isHelp) {
    setLoggerEnabled(false);
    showHelp();
    process.exit(EXIT.OK);
  }

  if (args.isVersion) {
    setLoggerEnabled(false);
    const packageJson = require("../../package.json");
    outputToConsole(`torch-it v${packageJson.version}`, "info");
    process.exit(EXIT.OK);
  }

  if (args.isConfig) {
    setLoggerEnabled(false);
    showConfig(getTorchRcConfig(args.filteredArgs));
    process.exit(EXIT.OK);
  }

  if (args.isDryRun) {
    process.env.TORCH_DRY_RUN = "1";
  }
}
