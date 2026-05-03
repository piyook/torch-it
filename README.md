# 🔥 Torch It

[![GitHub Release](https://img.shields.io/github/v/release/piyook/torch-it?include_prereleases&sort=semver)](https://github.com/piyook/torch-it/releases)
[![tests workflow](https://github.com/piyook/torch-it/actions/workflows/tests.yaml/badge.svg)](https://github.com/piyook/torch-it/actions/workflows/tests.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/torch-it)](https://www.npmjs.com/package/torch-it)

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

- **One command** to clean up 50+ build artifacts, cache directories, log files, and reinstall dependencies
- **Comprehensive framework support** — handles React, Next.js, Vue, Vite, SvelteKit, Remix, Qwik, Nuxt, Astro, Angular, Solid, and 40+ more
- **Smart file pattern matching** — removes `*.log`, `*.tgz`, `*.tar.gz`, and other temporary files automatically
- **Fully customizable** — specify any directories or files to delete via `torchrc.json`
- **Docker support** — optional Docker teardown, rebuild, and launch when you enable Docker mode 🐳
- **Cross-platform** — works on Windows, Linux, and macOS
- **Zero-dependency** — lightweight and no additional packages required

## Supported Frameworks

React, Next.js, Vue, Vite, SvelteKit, React Native, Expo, Remix, Qwik, Nuxt, Astro, Angular, Solid, Docusaurus, and 40+ more frameworks and tools.

## Comprehensive Cleanup Targets

`torch-it` cleans up 50+ common build artifacts, cache directories, and temporary files:

### Framework Build Outputs
- `dist`, `build`, `out`, `.output` - Standard build directories
- `.next` - Next.js build cache
- `.nuxt` - Nuxt.js build output  
- `.svelte-kit`, `.svelte` - Svelte/SvelteKit builds
- `.remix` - Remix framework build output
- `.qwik` - Qwik framework build output
- `.astro` - Astro framework build output
- `.angular`, `.angular/cache` - Angular build artifacts
- `.solid` - Solid.js build output
- `.docusaurus` - Docusaurus static site output
- `.nitro` - Nuxt Nitro server output

### Development Tool Caches
- `.cache`, `.parcel-cache`, `.webpack`, `.rollup.cache` - Build tool caches
- `.vite` - Vite build tool cache
- `.swc`, `.rpt2_cache` - JavaScript transpiler caches
- `.eslintcache`, `.stylelintcache`, `.sass-cache` - Linter/preprocessor caches
- `.babel-cache`, `.cache-loader` - Babel and webpack loader caches

### Package Manager Caches
- `node_modules/.cache` - npm package cache
- `.npm` - npm global cache
- `.pnpm-store`, `.pnpm-debug.log` - pnpm caches
- `.yarn/cache`, `.yarn/unplugged`, `.yarn/install-state.gz` - Yarn caches

### Monorepo & Build Tools
- `.turbo` - Turborepo cache
- `.nx/cache` - Nx build system cache
- `.lerna` - Lerna monorepo cache
- `.rush` - Rush monorepo cache
- `.yalc` - Yalc local package manager

### Blockchain & Web3 Tools
- `.hardhat` - Hardhat Ethereum development
- `.foundry` - Foundry Ethereum development  
- `.anchor` - Anchor Solana development

### Deployment & Platform Files
- `.vercel` - Vercel deployment cache
- `.netlify` - Netlify build cache
- `.wrangler` - Cloudflare Workers
- `.amplify` - AWS Amplify
- `.sst` - SST framework
- `.firebase` - Firebase hosting files
- `.serverless` - Serverless framework

### Mobile Development
- `android/.gradle`, `android/build`, `android/app/build` - Android builds
- `ios/Pods`, `ios/build` - iOS builds
- `.expo`, `.expo-shared` - Expo React Native

### File Patterns
- `*.log` - All log files
- `*.tgz`, `*.tar.gz` - Compressed archives
- `tsconfig.tsbuildinfo` - TypeScript incremental build info
- `coverage`, `.nyc_output` - Test coverage reports
- `storybook-static`, `.storybook-out` - Storybook builds

### Temporary Files
- `.tmp`, `tmp`, `temp` - Temporary directories
- `lib`, `es`, `cjs`, `umd` - Compiled JavaScript outputs
- `jspm_packages`, `.typings` - Package manager files

## Supported Package Managers

`npm` · `yarn` · `pnpm`

### Core Operations (Always Performed)

- **Removes build artifacts and cache directories** for 50+ JavaScript/Node.js frameworks and tools (e.g., `node_modules`, `dist`, `.next`, `.cache`, `.vite`, `.remix`, `.qwik`, etc.).
- **Removes log files and temporary artifacts** including `*.log`, `*.tgz`, `*.tar.gz`, and build info files.
- **Removes custom directories/paths** that you define in `torchrc.json`.
- **Cleans package manager caches** for npm, yarn, and pnpm.
- **Reinstalls dependencies** using your preferred package manager (npm, yarn, or pnpm).

### Docker Operations (Optional)

Runs only when **Docker mode is on** (`dockerMode`: `true` or `--dockerMode=true`) **and** the project root has a `Dockerfile` and/or **`docker-compose.yml` / `docker-compose.yaml`**. Default is **off**.

These steps target **Docker Compose**. You almost always want a Compose file; detection can trigger on a Dockerfile alone, but the commands below are Compose workflows, not a plain `docker build`.

**What runs, in order**

| When | What |
|------|------|
| **Start of run** | Checks `docker`, daemon (`docker info`), and `docker compose ps`. If those pass, runs **`docker compose down --rmi all --volumes`** — stops the stack and removes images and volumes tied to those services. Happens **before** local file/cache cleanup. |
| **After dependency reinstall** | If **rebuild** is enabled: **`docker-compose build --pull --no-cache`**. This uses the **`docker-compose`** binary (with a hyphen); it is separate from **`docker compose`**. |
| **If rebuild succeeded** | **`docker compose up -d`** — starts the stack in the background. |

**`rebuild: false`:** still runs the teardown row when Docker mode is on; skips reinstall and skips rebuild + `up`.

**`--test`:** only prints what it would run; nothing above executes.

**Edge case:** If teardown hits trouble (e.g. `docker compose ps` fails) but Docker wasn’t skipped entirely, rebuild and `up` may still run. If Docker is skipped completely (no CLI, daemon down, no matching files, etc.), rebuild and `up` are skipped too.

---

## Usage

### Global Installation (Recommended)

Install torch-it globally to run it from anywhere:

```bash
npm install -g torch-it
```

Then, in your project root, simply run:

```bash
torch-it
```

In an interactive terminal, `torch-it` prints the same cleanup preview as `--config` and asks you to confirm (**Yes** / **No**, or **y** / **n**) before it removes anything or touches Docker. Non-interactive environments (no TTY), `--test` dry runs, and **`--yes`** or **`-y`** skip that prompt.

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

### Confirmation prompt

Before destructive steps, `torch-it` shows effective settings and the files/directories that would be removed (same detail as `--config`), then asks **Continue? Type Yes or No (y/n):**. Answer **yes** or **y** to proceed; anything else cancels the run.

This prompt is skipped when:

- You pass **`--yes`** or **`-y`** (for CI, scripts, or automation).
- You use **`--test`** (dry run; nothing is changed).
- Standard input is **not a TTY** (for example some CI runners), so the tool proceeds without blocking.

### Dry Run (`--test`)

Use `--test` to preview what `torch-it` would do without deleting directories, cleaning caches, installing dependencies, or changing Docker resources. Dry run does not show the interactive confirmation prompt.

```bash
torch-it --test
```

### Configuration (`--config`)

Use `--config` to display the current torch-it configuration, including all files and directories that will be targeted for deletion during a torch-it run. This is useful for verifying your setup before performing actual cleanup operations.

```bash
torch-it --config
```

The configuration display shows:
- Current settings from `torchrc.json` (if present) or defaults
- All built-in cleanup targets
- Custom paths that will be removed
- Protected paths that will be preserved
- Docker and rebuild operation settings

This helps you understand exactly what will be affected before running torch-it, making it easier to verify your configuration is correct.

---
## Customization

For project-level customization, create a local `torchrc.json` file in your project root with the following structure:

```json
{
  "customPaths": ["apps/web/.next", "services/api/tmp", ".turbo/cache", "coverage-final.json"],
  "protectedPaths": ["important-data/", "config/production.json"],
  "dockerMode": false,
  "rebuild": true,
  "logfile": true
}
```

- `customPaths`: Array of additional directories and files to remove during cleanup. Supports both directories and files. torch-it will remove these in the same cleanup pass as the built-in targets.
- `protectedPaths`: Array of directories and files to skip during cleanup. These paths will be preserved even if they match built-in or custom cleanup targets.
- `dockerMode`: Boolean flag to enable/disable Docker operations. Set to `true` to run Docker cleanup, rebuild, and launch when compose/Dockerfile files exist. Defaults to `false`.
- `rebuild`: Boolean flag to enable/disable rebuild operations. Set to `false` to skip both **package manager dependency installation** and **Docker rebuild/launch** while still performing cleanup. Defaults to `true`.
- `logfile`: Boolean flag to enable or disable writing runtime output to `torch-it.log`. Set to `true` to enable file logging. Defaults to `false`.

**Note**: The local `torchrc.json` file is completely optional. torch-it works with sensible defaults out of the box. Only create this file if you need to customize the behavior.

## Command Line Options

You can override `torchrc.json` settings directly from the command line using flags. This is useful for one-off runs or CI/CD pipelines.

```bash
torch-it --yes --rebuild=false --customPaths=["temp/","logs/"]
```

All configuration options can be overridden using `--optionName=value` syntax. For arrays and objects, use JSON syntax:

- `--help` - Show help message and available options
- `--version, -v` - Show version information and exit
- `--config` - Show current configuration and exit
- `--test` - Run in dry-run mode (preview changes without executing)
- `--yes`, `-y` - Skip the interactive confirmation prompt (auto-confirm)
- `--customPaths=["path1","path2"]`
- `--dockerMode=true` - Enable Docker steps when Docker files are present (`false` is the default)
- `--rebuild=false`
- `--logfile=true`

Command line flags take precedence over `torchrc.json` settings.   

The config option `--config` will show all current settings including those from command line flags and a list of all files and directories that will be cleaned in the current project.   



## Logging   

`torch-it` outputs information to the console. By default, no log file is written. If you want to save runtime output to `torch-it.log` in your project root for troubleshooting purposes, set `logfile` to `true` in `torchrc.json`.

This file should be ignored by git to avoid accidental commits. Add this to your `.gitignore`:   

  ```gitignore
  torch-it.log
  ```


## Troubleshooting

- **Docker:** From the project root, does **`docker compose ps`** work? Is the **`docker-compose`** (hyphen) CLI on your PATH for rebuilds? Is the daemon up (`docker info`)?
- If you see errors about missing `package.json`, initialize your project with `npm init -y` or add your project files.
- For detailed information about any failures, check the `torch-it.log` file.


---

## License

MIT

---

**Happy torching!** 🔥✨
