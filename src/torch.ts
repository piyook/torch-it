import { printBanner, outputToConsole } from "./utils/ui";
import { clearLog, setLoggerEnabled } from "./utils/logger";
import { getTorchRcConfig } from "./utils/cleanup";
import { parseCliArgs, handleSpecialFlags } from "./utils/cli";
import { executeTorchWorkflow } from "./utils/torch-execution";
import { validateNodeProject } from "./utils/project-validation";

// --- Initialisation ---
const cliArgs = process.argv.slice(2);
const parsedArgs = parseCliArgs(cliArgs);

// Handle special flags that exit early
handleSpecialFlags(parsedArgs);

const torchRcConfig = getTorchRcConfig(parsedArgs.filteredArgs);
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
    "warn",
  );
}

// --- Execute Torch Workflow ---
void (async () => {
  await executeTorchWorkflow(torchRcConfig, {
    assumeYes: parsedArgs.assumeYes,
  });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
