import { setLoggerEnabled } from "./logger";
import { outputToConsole } from "./ui";
import { showHelp } from "./help";
import { showConfig } from "./config-display";

export interface CliArgs {
  isHelp: boolean;
  isVersion: boolean;
  isConfig: boolean;
  isDryRun: boolean;
  assumeYes: boolean;
  filteredArgs: string[];
}

export function parseCliArgs(args: string[]): CliArgs {
  const isHelp = args.includes("--help");
  const isVersion = args.includes("--version") || args.includes("-v");
  const isConfig = args.includes("--config");
  const isDryRun = args.includes("--test");
  const assumeYes = args.includes("--yes") || args.includes("-y");

  const filteredArgs = args.filter(
    (arg) =>
      arg !== "--test" &&
      arg !== "--help" &&
      arg !== "--version" &&
      arg !== "-v" &&
      arg !== "--config" &&
      arg !== "--yes" &&
      arg !== "-y",
  );

  return {
    isHelp,
    isVersion,
    isConfig,
    isDryRun,
    assumeYes,
    filteredArgs,
  };
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
    showConfig();
    process.exit(0);
  }

  if (args.isDryRun) {
    process.env.TORCH_DRY_RUN = "1";
  }
}
