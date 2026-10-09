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
4. Cleans the cache of the package manager your project uses (npm, yarn, or pnpm, picked from the lockfile). This cache is shared by every project on your machine, so later installs elsewhere will download again
5. Reinstalls all dependencies

### Optionally runs (Docker mode)

When `dockerMode: true` and a Compose file is present (`compose.yaml`, `compose.yml`, `docker-compose.yaml` or `docker-compose.yml`):

| Step | When | Command |
|------|------|---------|
| Teardown | Before cleanup | `docker compose down --rmi all --volumes` |
| Rebuild | After dependency install | `docker compose build --pull --no-cache` |
| Start | After successful rebuild | `docker compose up -d` |

> **Warning:** The teardown removes the project's containers, images **and volumes**. Anything stored in a volume, such as a development database, is lost.

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

Some Git Bash windows on Windows do not count as a terminal. If you get this message there, run `winpty torch-it`, or use PowerShell or Windows Terminal.

### Dry run (preview only, no changes)

```bash
torch-it --test
```

Lists every path that would be removed and every command that would run. Nothing is deleted and nothing is asked.

### Show current configuration

```bash
torch-it --config
```

Displays all active settings, every cleanup target, custom paths, protected paths, and Docker settings. Useful for verifying your setup before running. Command line overrides are included, so `torch-it --config --protectedPaths=dist` shows what that run would do.

### Output

At a terminal, `torch-it` uses colour, emoji and boxes. When its output is piped, redirected or captured (CI, scripts, AI agents), it switches to plain text on its own: no colour, emoji, banner or boxes, and one prefix per kind of line.

| Line starts with | Meaning | Goes to |
|------------------|---------|---------|
| `> ` | A step is starting | stdout |
| `ok: ` | Something succeeded | stdout |
| `warning: ` | Something was skipped or needs a look | stderr |
| `error: ` | Something failed | stderr |
| anything else | Information, and the summary at the end | stdout |

- `--plain` forces plain text at a terminal.
- `--quiet` prints only warnings, errors, the paths a dry run would remove and the final summary, and hides the progress output of the install and Docker commands. The plan you are asked to confirm is still shown.
- Set the `NO_COLOR` environment variable to drop colour and keep everything else.

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Every step that was meant to run succeeded, or there was nothing to do |
| `1` | Nothing was changed: invalid options or `torchrc.json`, not a Node.js project, or no terminal to confirm on and no `--yes` |
| `2` | The run went ahead and a step failed: a path could not be removed, dependency install failed, or Docker mode is on and Docker is unavailable or a Docker step failed |
| `3` | You answered no at the prompt. Nothing was changed |

A dry run that can see the real run would fail also exits with `2`.

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

Paths are relative to the project root. A trailing slash, a leading `./` and letter case make no difference: `important-data`, `important-data/`, `./important-data` and `Important-Data` are the same path.

`torch-it` only deletes inside the directory it is run in. A `customPaths` entry that is the project root or outside it (`.`, `..`, `../other`) stops the run.

If a target is a symbolic link with a protected path inside it, the link is left alone rather than followed.

An unknown option or a value of the wrong type, in `torchrc.json` or on the command line, stops `torch-it` before anything is deleted. A typo in `protectedPaths` should never cost you the files you meant to keep.

### Command line overrides

Any config option can be set with a flag. For the true/false options, flags take precedence over `torchrc.json`.

```bash
torch-it --yes --rebuild=false --customPaths=temp,logs
torch-it --dockerMode=true --logfile=true
```

A list flag adds to the list of the same name in `torchrc.json`: `--protectedPaths=coverage` protects `coverage` as well as everything the file protects. To take a path out of a list, edit the file.

List options take comma-separated paths. A JSON array works too, but most shells need it quoted: `'--customPaths=["temp","logs"]'`.

**All flags:**

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Show help and available options |
| `--version`, `-v` | Show version and exit |
| `--config` | Show current configuration and exit |
| `--test` | Dry run — preview changes without executing |
| `--yes`, `-y` | Skip confirmation prompt |
| `--quiet`, `-q` | Print only warnings, errors and the final summary |
| `--plain` | No colour, emoji, banner or boxes. Automatic when output is not a terminal |
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

## Using with AI agents and scripts

[`llms.txt`](llms.txt) is the reference for AI coding agents and scripts: every option, what is deleted, how protection works, exit codes and the phrases to look for in the output. It ships in the npm package next to this README.

The safe sequence is the same for an agent as for a person in a hurry:

```bash
torch-it --test    # preview: nothing is deleted, nothing is asked
torch-it --yes     # run it, once the list has been checked
```

Captured output is plain text with a fixed prefix per line (see [Output](#output)), and `--quiet` cuts it down to warnings, errors and the summary. Scripts should rely on the exit code first.

---

## Logging

By default, output goes to the console only. To save a log file for troubleshooting, set `logfile: true` in `torchrc.json` or pass `--logfile=true`.

The log is written to `torch-it.log` in your project root, and is left in place by the `*.log` cleanup while logging is on. Add it to `.gitignore`:

```gitignore
torch-it.log
```

---

## Troubleshooting

**"N path(s) could not be removed":** Something still has those files open, usually a dev server, a test watcher or your editor holding `node_modules`. Stop it and run `torch-it` again.

**Docker issues:** Docker mode needs a Compose file in the project root. Run `docker compose ps` there to check if Compose is working. For rebuilds, confirm `docker compose` is on your PATH. Check that the Docker daemon is running with `docker info`.

**Missing `package.json`:** Run `npm init -y` to initialise a project, or make sure you're in the right directory.

**Not sure what will be deleted?** Run `torch-it --config` to see the full list of targets, or `torch-it --test` for a dry run.

---

## Upgrading from 2.x

Version 3 closes several ways a run could delete more than intended. If you used 2.x, these are the changes you may notice:

| Change | What to do |
|--------|------------|
| With no terminal (CI, pipes) and no `--yes`, it stops with exit code `1` instead of deleting unprompted | Add `--yes` to automated runs |
| Answering no at the prompt exits with `3`, not `0` | Check scripts that wrap an interactive run |
| An invalid `torchrc.json`, an unknown option or a value of the wrong type stops the run. Before, it was ignored | Fix the option it names |
| `lib`, `es`, `cjs` and `umd` are no longer deleted by default | Add them to `customPaths` if your build writes to them |
| Only the cache of the package manager your project uses is cleaned, not every one installed | Nothing |
| Exit code is `2` when a path can not be removed, the dependency install fails, or Docker mode is on and Docker is unavailable or a Docker step fails | Check scripts that assumed `0` |
| A `customPaths` entry that is the project root or outside it is refused | Run `torch-it` from the directory you want cleaned |
| Protected paths are matched without regard to case | Nothing |
| Docker mode needs a Compose file; a `Dockerfile` alone is skipped. `compose.yaml` and `compose.yml` are now recognised | Nothing |
| `*.log`, `*.tgz` and `*.tar.gz` match those extensions only. Before, `*.log` also caught root files such as `catalog.json` | Nothing |
| List flags take comma-separated paths: `--customPaths=temp,logs` | The quoted JSON form still works |
| Output that is not going to a terminal is plain text, and warnings and errors go to stderr | Update anything that matched the old emoji or read errors from stdout |

---

## Development

```bash
npm install
npm run torch-it:ts -- --test   # run from source with tsx
npm run quality                 # lint, format check, fallow and tests
npm run build                   # bundle to dist/torch-it.js
```

- `npm run fallow` checks for unused code, duplication and over-complex functions. It runs in the pre-push hook and in CI.
- Branches are named `feat/…`, `fix/…`, `hotfix/…`, `release/…` or `chore/…`, and commits follow [Conventional Commits](https://www.conventionalcommits.org/). Both are checked by hooks and in CI.
- Open pull requests against `dev`. `dev` is merged into `main` for a release.

---

## License

MIT — **Happy torching!** 🔥✨