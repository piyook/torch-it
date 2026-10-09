import { setLoggerEnabled } from "./logger";
import { outputToConsole } from "./ui";
import { showHelp } from "./help";
import { showConfig } from "./config-display";
import { getTorchRcConfig } from "./torchrc";

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

  for (const arg of args) {
    const flag = FLAGS[arg];
    if (flag) {
      parsed[flag] = true;
    } else {
      // Everything else is a config override, checked by the config parser
      parsed.filteredArgs.push(arg);
    }
  }

  return parsed;
}

export function handleSpecialFlags(args: CliArgs): void {
  if (args.isHelp) {
    setLoggerEnabled(false);
    showHelp();
    process.exit(0);
  }

  if (args.isVersion) {
    setLoggerEnabled(false);
    const packageJson = require("../../package.json");
    outputToConsole(`torch-it v${packageJson.version}`, "info");
    process.exit(0);
  }

  if (args.isConfig) {
    setLoggerEnabled(false);
    showConfig(getTorchRcConfig(args.filteredArgs));
    process.exit(0);
  }

  if (args.isDryRun) {
    process.env.TORCH_DRY_RUN = "1";
  }
}
