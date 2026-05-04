# 🔥 Torch It

[![GitHub Release](https://img.shields.io/github/v/release/piyook/torch-it?include_prereleases&sort=semver)](https://github.com/piyook/torch-it/releases)
[![tests workflow](https://github.com/piyook/torch-it/actions/workflows/tests.yaml/badge.svg)](https://github.com/piyook/torch-it/actions/workflows/tests.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/torch-it)](https://www.npmjs.com/package/torch-it)

> **One command to nuke caches, dependencies, and Docker environments — then rebuild from scratch.**

Project stopped working for no obvious reason? `torch-it` cleans up 50+ build artifacts, cache directories, and temporary files, then reinstalls your dependencies fresh. It's surprising how often this just fixes things. 🤞

---

## Quick Start

```bash
npm install -g torch-it   # install globally (recommended)
cd your-project
torch-it                  # clean and rebuild
```

`torch-it` will show you a preview of what it's about to delete and ask for confirmation before doing anything destructive.

---

## What It Does

### Always runs

1. Removes build artifacts and cache directories (50+ targets — `node_modules`, `dist`, `.next`, `.cache`, `.vite`, etc.)
2. Removes log files and temporary files (`*.log`, `*.tgz`, `*.tar.gz`, etc.)
3. Removes any custom paths you define in `torchrc.json`
4. Cleans your package manager's cache (npm, yarn, or pnpm)
5. Reinstalls all dependencies

### Optionally runs (Docker mode)

When `dockerMode: true` and a `docker-compose.yml` or `Dockerfile` is present:

| Step | When | Command |
|------|------|---------|
| Teardown | Before cleanup | `docker compose down --rmi all --volumes` |
| Rebuild | After dependency install | `docker compose build --pull --no-cache` |
| Start | After successful rebuild | `docker compose up -d` |

> **Note:** All Docker operations use `docker compose` (plugin). Ensure Docker Compose plugin is installed and on your PATH.

---

## Installation

### Global (recommended)

Install once, use in any project:

```bash
npm install -g torch-it
```

### Per-project

```bash
npm install torch-it --save-dev
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "torch": "torch-it"
  }
}
```

Then run with `npm run torch` or `npx torch-it`.

---

## Usage

### Basic run

```bash
torch-it
```

Shows a preview of what will be deleted, then prompts: **Continue? Type Yes or No (y/n)**.

### Skip confirmation (CI / automation)

```bash
torch-it --yes   # or -y
```

### Dry run (preview only, no changes)

```bash
torch-it --test
```

### Show current configuration

```bash
torch-it --config
```

Displays all active settings, every cleanup target, custom paths, protected paths, and Docker settings. Useful for verifying your setup before running.

---

## Configuration

Create a `torchrc.json` file in your project root to customise behaviour. Everything is optional — `torch-it` works with sensible defaults out of the box.

```json
{
  "customPaths": ["apps/web/.next", "services/api/tmp", "coverage-final.json"],
  "protectedPaths": ["important-data/", "config/production.json"],
  "dockerMode": false,
  "rebuild": true,
  "logfile": false
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customPaths` | `string[]` | `[]` | Extra directories or files to delete during cleanup |
| `protectedPaths` | `string[]` | `[]` | Paths to skip — preserved even if they match built-in targets |
| `dockerMode` | `boolean` | `false` | Enable Docker teardown, rebuild, and launch |
| `rebuild` | `boolean` | `true` | Set to `false` to skip dependency reinstall and Docker rebuild (cleanup still runs) |
| `logfile` | `boolean` | `false` | Write runtime output to `torch-it.log` in the project root |

### Command line overrides

Any config option can be overridden with a flag. Flags take precedence over `torchrc.json`.

```bash
torch-it --yes --rebuild=false --customPaths=["temp/","logs/"]
torch-it --dockerMode=true --logfile=true
```

**All flags:**

| Flag | Description |
|------|-------------|
| `--help` | Show help and available options |
| `--version`, `-v` | Show version and exit |
| `--config` | Show current configuration and exit |
| `--test` | Dry run — preview changes without executing |
| `--yes`, `-y` | Skip confirmation prompt |
| `--customPaths=[...]` | Extra paths to delete |
| `--protectedPaths=[...]` | Paths to preserve |
| `--dockerMode=true\|false` | Enable/disable Docker steps |
| `--rebuild=true\|false` | Enable/disable dependency reinstall and Docker rebuild |
| `--logfile=true\|false` | Enable/disable log file output |

---

## Supported Frameworks & Tools

React, Next.js, Vue, Vite, SvelteKit, React Native, Expo, Remix, Qwik, Nuxt, Astro, Angular, Solid, Docusaurus, and 40+ more.

**Package managers:** npm · yarn · pnpm

<details>
<summary>Full list of cleanup targets</summary>

### Framework build outputs
`dist`, `build`, `out`, `.output`, `.next`, `.nuxt`, `.svelte-kit`, `.svelte`, `.remix`, `.qwik`, `.astro`, `.angular`, `.angular/cache`, `.solid`, `.docusaurus`, `.nitro`

### Build tool caches
`.cache`, `.parcel-cache`, `.webpack`, `.rollup.cache`, `.vite`, `.swc`, `.rpt2_cache`, `.eslintcache`, `.stylelintcache`, `.sass-cache`, `.babel-cache`, `.cache-loader`

### Package manager caches
`node_modules/.cache`, `.npm`, `.pnpm-store`, `.pnpm-debug.log`, `.yarn/cache`, `.yarn/unplugged`, `.yarn/install-state.gz`

### Monorepo & build tools
`.turbo`, `.nx/cache`, `.lerna`, `.rush`, `.yalc`

### Blockchain & Web3
`.hardhat`, `.foundry`, `.anchor`

### Deployment & platform
`.vercel`, `.netlify`, `.wrangler`, `.amplify`, `.sst`, `.firebase`, `.serverless`

### Mobile development
`android/.gradle`, `android/build`, `android/app/build`, `ios/Pods`, `ios/build`, `.expo`, `.expo-shared`

### File patterns
`*.log`, `*.tgz`, `*.tar.gz`, `tsconfig.tsbuildinfo`, `coverage`, `.nyc_output`, `storybook-static`, `.storybook-out`

### Temporary files
`.tmp`, `tmp`, `temp`, `lib`, `es`, `cjs`, `umd`, `jspm_packages`, `.typings`

</details>

---

## Logging

By default, output goes to the console only. To save a log file for troubleshooting, set `logfile: true` in `torchrc.json` or pass `--logfile=true`.

The log is written to `torch-it.log` in your project root. Add it to `.gitignore`:

```gitignore
torch-it.log
```

---

## Troubleshooting

**Docker issues:** Run `docker compose ps` from the project root to check if Compose is working. For rebuilds, confirm `docker compose` is on your PATH. Check that the Docker daemon is running with `docker info`.

**Missing `package.json`:** Run `npm init -y` to initialise a project, or make sure you're in the right directory.

**Not sure what will be deleted?** Run `torch-it --config` to see the full list of targets, or `torch-it --test` for a dry run.

---

## License

MIT — **Happy torching!** 🔥✨