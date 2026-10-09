import { outputToConsole } from "./ui";

export const showHelp = () => {
  const helpMessage = `
🔥 Torch It - Project Environment Reset Tool

USAGE:
  torch-it [options]

OPTIONS:
  --help                 Show this help message and exit
  --version, -v          Show version information and exit
  --config               Show current configuration and exit
  --test                 Run in dry-run mode (preview changes without executing)
  --yes, -y              Skip the confirmation prompt (required when there is no terminal, e.g. CI)
  --dockerMode=<bool>    Enable/disable Docker Compose operations (default: false)
  --rebuild=<bool>       Enable/disable rebuild operations (default: true)
  --logfile=<bool>       Enable/disable file logging (default: false)
  --customPaths=<list>   Additional paths to remove during cleanup (comma-separated)
  --protectedPaths=<list> Paths to skip during cleanup (comma-separated)

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

EXIT CODES:
  0  Finished (or nothing to do)
  1  Invalid options, no confirmation possible, or a step failed

CONFIGURATION:
  Create a torchrc.json file in your project root for persistent settings:

  {
    "customPaths": ["apps/web/.next", "coverage-final.json"],
    "protectedPaths": ["important-data/"],
    "dockerMode": false,
    "rebuild": true,
    "logfile": false
  }

For more information, visit: https://github.com/piyook/torch-it
`;

  outputToConsole(helpMessage.trim(), "info");
};
