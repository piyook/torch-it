import { outputToConsole } from "./ui";

export const showHelp = () => {
  const helpMessage = `
🔥 Torch It - Project Environment Reset Tool

USAGE:
  torch-it [options]

OPTIONS:
  --help, -h             Show this help message and exit
  --version, -v          Show version information and exit
  --config               Show current configuration and exit
  --test                 Run in dry-run mode (preview changes without executing)
  --yes, -y              Skip the confirmation prompt (required when there is no terminal, e.g. CI)
  --quiet, -q            Print only warnings, errors and the final summary
  --plain                No colour, emoji, banner or boxes (automatic when output is not a terminal)
  --json                 Print one JSON document describing the run (needs --yes or --test)
  --cwd=<dir>            Run in <dir> instead of the current directory
  --dockerMode=<bool>    Enable/disable Docker Compose operations (default: false)
  --dockerVolumes=<bool> Also remove Docker volumes in Docker mode (default: false)
  --rebuild=<bool>       Enable/disable rebuild operations (default: true)
  --cacheClean=<bool>    Enable/disable the package manager cache clean (default: true)
  --only=<list>          Remove only these paths instead of the default targets
  --allowTracked=<bool>  Also remove files tracked in git (default: false, they are kept)
  --logfile=<bool>       Enable/disable file logging (default: false)
  --customPaths=<list>   Additional paths to remove during cleanup (comma-separated)
  --protectedPaths=<list> Paths to skip during cleanup (comma-separated)

  Lists given here are added to the ones in torchrc.json.

EXAMPLES:
  torch-it                           # Run with default settings
  torch-it --version                  # Show version information
  torch-it --config                   # Show current configuration
  torch-it --test                     # Preview what would be done
  torch-it --yes                      # No confirmation prompt (same as -y)
  torch-it --rebuild=false            # Clean only, don't rebuild
  torch-it --dockerMode=true          # Enable Docker cleanup/rebuild when configured
  torch-it --logfile=true              # Enable file logging
  torch-it --customPaths=temp,logs    # Clean additional paths
  torch-it --protectedPaths=dist      # Keep a path that would otherwise be removed
  torch-it --only=node_modules --cacheClean=false  # Just reinstall dependencies
  torch-it --cwd=apps/web --test      # Preview another directory
  torch-it --test --json              # The plan, as JSON

OUTPUT:
  Warnings and errors go to stderr, everything else to stdout.
  Set NO_COLOR to turn colour off and keep the rest.

EXIT CODES:
  0  Every step succeeded (or nothing to do)
  1  Nothing was changed: invalid options, not a Node.js project,
     or no terminal to confirm on and no --yes
  2  The run went ahead and a step failed (a path could not be removed,
     install failed, Docker unavailable or failed)
  3  You answered no at the prompt

CONFIGURATION:
  Create a torchrc.json file in your project root for persistent settings:

  {
    "customPaths": ["apps/web/.next", "coverage-final.json"],
    "protectedPaths": ["important-data/"],
    "dockerMode": false,
    "dockerVolumes": false,
    "rebuild": true,
    "cacheClean": true,
    "logfile": false
  }

For more information, visit: https://github.com/piyook/torch-it
`;

  outputToConsole(helpMessage.trim(), "info");
};
