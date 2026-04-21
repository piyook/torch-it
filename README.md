# 🔥 Torch It

[![GitHub Release](https://img.shields.io/github/v/release/piyook/torch-it?include_prereleases&sort=semver)](https://github.com/piyook/torch-it/releases)
[![tests workflow](https://github.com/piyook/torch-it/actions/workflows/tests.yaml/badge.svg)](https://github.com/piyook/torch-it/actions/workflows/tests.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, all-in-one, zero-dependency, fully customizable tool to **reset, clean, and rebuild** your Node.js (and optionally Dockerized) project environments with a single command.

---

Project stopped working for no obvious reason 😠 ?  

You'd like to kick it 🥾?   
Hit it with a hammer 🔨?   
Turn it off and on again 📺?     

Well better still - try torching it 🔥🔥🔥🔥🔥🔥   

## What does `torch-it` do?

Intelligently nukes your local caches, dependencies, and Docker environment depending on your framework and package manager — then rebuilds everything from a clean slate, **with a single command**.

It's surprising how often this just fixes things. 🤞

## Features

- **One command** to clear all local caches, delete `node_modules`, and reinstall dependencies
- **Fully customizable** — specify any directories or files to delete
- **Docker support** — removes containers, images, and volumes and rebuilds from scratch 🐳
- **Cross-platform** — works on Windows, Linux, and macOS
- **Zero-dependency** — lightweight and no additional packages required

## Supported Frameworks

React, Next.js, Vue, Vite, SvelteKit, React Native, Expo, and more.

## Supported Package Managers

`npm` · `yarn` · `pnpm`

### Core Operations (Always Performed)

- **Removes build artifacts and cache directories** for common JavaScript/Node.js frameworks (e.g., `node_modules`, `dist`, `.next`, `.cache`, etc.).
- **Removes custom directories/paths** that you define in `torchrc.json`.
- **Cleans package manager caches** for npm, yarn, and pnpm.
- **Reinstalls dependencies** using your preferred package manager (npm, yarn, or pnpm) - **skipped when `rebuild=false`**.

### Docker Operations (Only if Docker is Configured)

If your project includes either a `Dockerfile`, `docker-compose.yml`, or `docker-compose.yaml`, `torch-it` will also:

- **Stop and clean up Docker resources** (containers, images, volumes) if Docker is running.
- **Rebuild Docker images** from scratch - **skipped when `rebuild=false`**.
- **Restart Docker services** in detached mode - **skipped when `rebuild=false`**.

`torch-it` intelligently detects your project's configuration and only performs Docker operations when appropriate.

---

## Usage

### Global Installation (Recommended)

Install torch-it globally to run it from anywhere:

```bash
npm install -g torch-it
```

Then, in your project root,simply run:

```bash
torch-it
```

For per-project customisation, create a `torchrc.json` file in your project root (see Customization section below) or use command line flags (see Command Line Options section below).

### Per-Project Installation (Alternative)

If you prefer to install torch-it per project:

```bash
npm install torch-it --save-dev
```

Then run via npm scripts or npx:

Add to package.json scripts:

```json
{
  "scripts": {
    "torch": "torch-it"
  }
}
```

```bash
npm run torch
```

Or directly:

```bash
npx torch-it
```

### Dry Run (`--test`)

Use `--test` to preview what `torch-it` would do without deleting directories, cleaning caches, installing dependencies, or changing Docker resources. Results are saved to the `torch-it.log` file.

```bash
torch-it --test
```
---
## Customization

For project-level customization, create a local `torchrc.json` file in your project root with the following structure:

```json
{
  "customPaths": ["apps/web/.next", "services/api/tmp", ".turbo/cache", "coverage-final.json"],
  "protectedPaths": ["important-data/", "config/production.json"],
  "dockerMode": true,
  "rebuild": true,
  "logfile": false
}
```

- `customPaths`: Array of additional directories and files to remove during cleanup. Supports both directories and files. torch-it will remove these in the same cleanup pass as the built-in targets.
- `protectedPaths`: Array of directories and files to skip during cleanup. These paths will be preserved even if they match built-in or custom cleanup targets.
- `dockerMode`: Boolean flag to enable/disable Docker operations. Set to `false` to skip all Docker cleanup, rebuild, and launch steps. Defaults to `true`.
- `rebuild`: Boolean flag to enable/disable rebuild operations. Set to `false` to skip both package manager dependency installation and Docker rebuild/launch while still performing cleanup. Defaults to `true`.
- `logfile`: Boolean flag to enable or disable writing runtime output to `torch-it.log`. Set to `true` to enable file logging. Defaults to `false`.

**Note**: The local `torchrc.json` file is completely optional. torch-it works with sensible defaults out of the box. Only create this file if you need to customize the behavior.

## Command Line Options

You can override `torchrc.json` settings directly from the command line using flags. This is useful for one-off runs or CI/CD pipelines.

```bash
torch-it --dockerMode=false --rebuild=false --customPaths=["temp/","logs/"]
```

All configuration options can be overridden using `--optionName=value` syntax. For arrays and objects, use JSON syntax:

- `--customPaths=["path1","path2"]`
- `--dockerMode=false`
- `--rebuild=false`
- `--logfile=true`

Command line flags take precedence over `torchrc.json` settings.


## Logging   

`torch-it` outputs information to the console. By default, no log file is written. If you want to save runtime output to `torch-it.log` in your project root for troubleshooting purposes, set `logfile` to `true` in `torchrc.json`.

This file should be ignored by git to avoid accidental commits. Add this to your `.gitignore`:   

  ```gitignore
  torch-it.log
  ```


## Troubleshooting

- If you see errors related to Docker, check:
  1. Is Docker installed and running?
  2. Does your project have Docker configuration files?
  3. Are your Docker configuration files valid?
- If you see errors about missing `package.json`, initialize your project with `npm init -y` or add your project files.
- For detailed information about any failures, check the `torch-it.log` file.


---

## License

MIT

---

**Happy torching!** 🔥✨
