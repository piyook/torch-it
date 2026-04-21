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
  --dockerMode=<bool>    Enable/disable Docker operations (default: true)
  --rebuild=<bool>       Enable/disable rebuild operations (default: true)
  --logfile=<bool>       Enable/disable file logging (default: false)
  --customPaths=<array>   Additional paths to remove during cleanup
  --protectedPaths=<array> Paths to skip during cleanup

EXAMPLES:
  torch-it                           # Run with default settings
  torch-it --version                  # Show version information
  torch-it --config                   # Show current configuration
  torch-it --test                     # Preview what would be done
  torch-it --rebuild=false            # Clean only, don't rebuild
  torch-it --dockerMode=false         # Skip Docker operations
  torch-it --logfile=true              # Enable file logging
  torch-it --customPaths=["temp/","logs/"]  # Clean additional paths

CONFIGURATION:
  Create a torchrc.json file in your project root for persistent settings:
  
  {
    "customPaths": ["apps/web/.next", "coverage-final.json"],
    "protectedPaths": ["important-data/"],
    "dockerMode": true,
    "rebuild": true,
    "logfile": false
  }

For more information, visit: https://github.com/piyook/torch-it
`;

  outputToConsole(helpMessage.trim(), "info");
};
