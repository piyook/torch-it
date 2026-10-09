import { setLoggerEnabled } from "./logger";
import { outputToConsole } from "./ui";
import { showHelp } from "./help";
import { showConfig } from "./config-display";
import { getTorchRcConfig } from "./torchrc";
import { EXIT } from "../constants/constants";
import { exitWithError, isJsonMode, printJson } from "./json-output";
import { getVersion } from "./version";
import { readLlmsReference } from "./llms";

interface CliFlags {
  isHelp: boolean;
  isLlms: boolean;
  isVersion: boolean;
  isConfig: boolean;
  isDryRun: boolean;
  assumeYes: boolean;
  isQuiet: boolean;
  isPlain: boolean;
  isJson: boolean;
}

export interface CliArgs extends CliFlags {
  // Directory to run in, from --cwd. Undefined when the flag was not given.
  cwd?: string;
  filteredArgs: string[];
}

const FLAGS: Record<string, keyof CliFlags> = {
  "--help": "isHelp",
  "-h": "isHelp",
  "--llms": "isLlms",
  "--version": "isVersion",
  "-v": "isVersion",
  "--config": "isConfig",
  "--test": "isDryRun",
  "--yes": "assumeYes",
  "-y": "assumeYes",
  "--quiet": "isQuiet",
  "-q": "isQuiet",
  "--plain": "isPlain",
  "--json": "isJson",
};

export function parseCliArgs(args: string[]): CliArgs {
  const parsed: CliArgs = {
    isHelp: false,
    isLlms: false,
    isVersion: false,
    isConfig: false,
    isDryRun: false,
    assumeYes: false,
    isQuiet: false,
    isPlain: false,
    isJson: false,
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
    exitWithError();
  }
}

export function handleSpecialFlags(args: CliArgs): void {
  if (args.isHelp) {
    setLoggerEnabled(false);
    showHelp();
    process.exit(EXIT.OK);
  }

  if (args.isLlms) {
    const reference = readLlmsReference();
    if (reference === undefined) {
      outputToConsole(
        "llms.txt is missing from this install. Read it at https://github.com/piyook/torch-it/blob/main/llms.txt",
        "fail",
      );
      exitWithError();
    } else {
      // Printed as it is: it is a document, not a run of status lines
      process.stdout.write(reference);
    }
    process.exit(EXIT.OK);
  }

  if (args.isVersion) {
    setLoggerEnabled(false);
    if (isJsonMode()) {
      printJson({ version: getVersion() });
    } else {
      outputToConsole(`torch-it v${getVersion()}`, "info");
    }
    process.exit(EXIT.OK);
  }

  if (args.isConfig) {
    setLoggerEnabled(false);
    const config = getTorchRcConfig(args.filteredArgs);
    if (isJsonMode()) {
      printJson({ version: getVersion(), cwd: process.cwd(), config });
    } else {
      showConfig(config);
    }
    process.exit(EXIT.OK);
  }

  if (args.isDryRun) {
    process.env.TORCH_DRY_RUN = "1";
  }
}
