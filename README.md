# 🔥 Torch It

[![GitHub Release](https://img.shields.io/github/v/release/piyook/torch-it?include_prereleases&sort=semver)](https://github.com/piyook/torch-it/releases)
[![standard checks workflow](https://github.com/piyook/torch-it/actions/workflows/tests.yaml/badge.svg?branch=main)](https://github.com/piyook/torch-it/actions/workflows/tests.yaml)
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

`torch-it` will show you a preview of what it's about to delete and ask for confirmation before doing anything destructive. It never deletes unprompted: where there is no terminal to ask on (CI, pipes), it stops unless you pass `--yes`.

---

## What It Does

### Always runs

1. Removes build artifacts and cache directories (50+ targets — `node_modules`, `dist`, `.next`, `.cache`, `.vite`, etc.)
2. Removes log files and temporary files (`*.log`, `*.tgz`, `*.tar.gz`, etc.)
3. Removes any custom paths you define in `torchrc.json`
4. Cleans the cache of the package manager your project uses (npm, yarn, or pnpm, picked from the lockfile)
5. Reinstalls all dependencies

### Optionally runs (Docker mode)

When `dockerMode: true` and a Compose file is present (`compose.yaml`, `compose.yml`, `docker-compose.yaml` or `docker-compose.yml`):

| Step | When | Command |
|------|------|---------|
| Teardown | Before cleanup | `docker compose down --rmi all --volumes` |
| Rebuild | After dependency install | `docker compose build --pull --no-cache` |
| Start | After successful rebuild | `docker compose up -d` |

> **Note:** All Docker operations use `docker compose` (plugin). Ensure Docker Compose plugin is installed and on your PATH. A project with only a `Dockerfile` and no Compose file is left alone.

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

`--yes` is required when there is no interactive terminal. Without it, `torch-it` exits with code `1` and changes nothing.

### Dry run (preview only, no changes)

```bash
torch-it --test
```

### Show current configuration

```bash
torch-it --config
```

Displays all active settings, every cleanup target, custom paths, protected paths, and Docker settings. Useful for verifying your setup before running. Command line overrides are included, so `torch-it --config --protectedPaths=dist` shows what that run would do.

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Finished, or there was nothing to do |
| `1` | Invalid options, no way to confirm, or a step failed (dependency install, Docker) |

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
| `protectedPaths` | `string[]` | `[]` | Paths to skip — preserved even if they match built-in targets. A protected path inside a target (e.g. `dist/keep.json`) is kept while the rest of the target is removed |
| `dockerMode` | `boolean` | `false` | Enable Docker teardown, rebuild, and launch |
| `rebuild` | `boolean` | `true` | Set to `false` to skip dependency reinstall and Docker rebuild (cleanup still runs) |
| `logfile` | `boolean` | `false` | Write runtime output to `torch-it.log` in the project root |

`customDirs` and `customFiles` are also accepted and behave exactly like `customPaths`.

Paths are relative to the project root. A trailing slash or leading `./` makes no difference: `important-data`, `important-data/` and `./important-data` are the same path.

An unknown option or a value of the wrong type, in `torchrc.json` or on the command line, stops `torch-it` before anything is deleted. A typo in `protectedPaths` should never cost you the files you meant to keep.

### Command line overrides

Any config option can be overridden with a flag. Flags take precedence over `torchrc.json`.

```bash
torch-it --yes --rebuild=false --customPaths=temp,logs
torch-it --dockerMode=true --logfile=true
```

List options take comma-separated paths. A JSON array works too, but most shells need it quoted: `'--customPaths=["temp","logs"]'`.

**All flags:**

| Flag | Description |
|------|-------------|
| `--help` | Show help and available options |
| `--version`, `-v` | Show version and exit |
| `--config` | Show current configuration and exit |
| `--test` | Dry run — preview changes without executing |
| `--yes`, `-y` | Skip confirmation prompt |
| `--customPaths=a,b` | Extra paths to delete |
| `--protectedPaths=a,b` | Paths to preserve |
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
`.cache`, `.parcel-cache`, `.webpack`, `.rollup.cache`, `.vite`, `.vite/deps`, `.swc`, `.rpt2_cache`, `.eslintcache`, `.stylelintcache`, `.sass-cache`, `.babel-cache`, `.cache-loader`

### Package manager caches
`node_modules/.cache`, `.npm`, `.pnpm-store`, `.pnpm-debug.log`, `.yarn/cache`, `.yarn/unplugged`, `.yarn/install-state.gz`, `.yarn/build-state.yml`

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

The `*` patterns match files in the project root only.

### Temporary files
`.tmp`, `tmp`, `temp`, `jspm_packages`, `.typings`

`lib`, `es`, `cjs` and `umd` are **not** removed by default, because they often hold hand-written source. If your project builds into them, add them to `customPaths`.

</details>

---

## Logging

By default, output goes to the console only. To save a log file for troubleshooting, set `logfile: true` in `torchrc.json` or pass `--logfile=true`.

The log is written to `torch-it.log` in your project root, and is left in place by the `*.log` cleanup while logging is on. Add it to `.gitignore`:

```gitignore
torch-it.log
```

---

## Troubleshooting

**Docker issues:** Docker mode needs a Compose file in the project root. Run `docker compose ps` there to check if Compose is working. For rebuilds, confirm `docker compose` is on your PATH. Check that the Docker daemon is running with `docker info`.

**Missing `package.json`:** Run `npm init -y` to initialise a project, or make sure you're in the right directory.

**Not sure what will be deleted?** Run `torch-it --config` to see the full list of targets, or `torch-it --test` for a dry run.

---

## License

MIT — **Happy torching!** 🔥✨