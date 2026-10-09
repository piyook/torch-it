import { configureOutput, printBanner, outputToConsole } from "./utils/ui";
import { clearLog, setLoggerEnabled } from "./utils/logger";
import { getTorchRcConfig } from "./utils/torchrc";
import {
  applyWorkingDirectory,
  parseCliArgs,
  handleSpecialFlags,
} from "./utils/cli";
import {
  ensureRunCanBeConfirmed,
  executeTorchWorkflow,
} from "./utils/torch-execution";
import { validateNodeProject } from "./utils/project-validation";
import { torchFailed } from "./utils/status";
import { EXIT } from "./constants/constants";
import {
  buildRunResult,
  exitWithError,
  isJsonMode,
  printJson,
  setJsonMode,
} from "./utils/json-output";

// --- Initialisation ---
const cliArgs = process.argv.slice(2);
const parsedArgs = parseCliArgs(cliArgs);
// --help is for people, so it is printed as usual even next to --json
setJsonMode(parsedArgs.isJson && !parsedArgs.isHelp && !parsedArgs.isLlms);
configureOutput({ plain: parsedArgs.isPlain, quiet: parsedArgs.isQuiet });
applyWorkingDirectory(parsedArgs);

// Handle special flags that exit early
handleSpecialFlags(parsedArgs);

const torchRcConfig = getTorchRcConfig(parsedArgs.filteredArgs);
ensureRunCanBeConfirmed({ assumeYes: parsedArgs.assumeYes });
setLoggerEnabled(torchRcConfig.logfile);
if (torchRcConfig.logfile) {
  clearLog();
}
printBanner();

// Validate that this is a Node.js project
validateNodeProject();

if (parsedArgs.isDryRun) {
  outputToConsole(
    "Running in --test dry-run mode (no files or services will be changed)",
    "info",
  );
}

// --- Execute Torch Workflow ---
void (async () => {
  const torchRecord = await executeTorchWorkflow(torchRcConfig, {
    assumeYes: parsedArgs.assumeYes,
  });
  const exitCode = torchFailed(torchRecord) ? EXIT.STEP_FAILED : EXIT.OK;
  if (isJsonMode()) {
    printJson(buildRunResult(torchRecord, exitCode));
  }
  if (exitCode !== EXIT.OK) {
    process.exitCode = exitCode;
  }
})().catch((err) => {
  outputToConsole(`Unexpected error: ${err}`, "fail");
  exitWithError();
});
