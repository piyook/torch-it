# 🔥 Torch It

[![GitHub Release](https://img.shields.io/github/v/release/piyook/torch-it?include_prereleases&sort=semver)](https://github.com/piyook/torch-it/releases)
[![tests workflow](https://github.com/piyook/torch-it/actions/workflows/tests.yaml/badge.svg)](https://github.com/piyook/torch-it/actions/workflows/tests.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, all-in-one TypeScript tool to **reset, clean, and rebuild** your Node.js (and optionally Dockerized) project environments with a single command.

---

Project stopped working for no obvious reason 😠 ?  

You'd like to kick it 🥾?   
Hit it with a hammer 🔨?   
Turn it off and on again 📺?     

Well better still - try torching it instead 🔥🔥🔥🔥🔥🔥.   

## What does `torch-it` do?

Nuke your local caches, dependencies, and Docker environment — then rebuild everything from a clean slate, **with a single command**.

It's surprising how often this just fixes things. 🤞

## Features

- **One command** to clear all local caches, delete `node_modules`, and reinstall dependencies
- **Fully customizable** — specify any directories or files to delete
- **Docker support** — removes containers, images, and volumes and rebuilds from scratch 🐳

## Supported Frameworks

React, Next.js, Vue, Vite, SvelteKit, React Native, Expo, and more.

## Supported Package Managers

`npm` · `yarn` · `pnpm`

### Core Operations (Always Performed)

- **Removes build artifacts and cache directories** for common JavaScript/Node.js frameworks (e.g., `node_modules`, `dist`, `.next`, `.cache`, etc.).
- **Removes custom directories/paths** that you define in `torchrc.json`.
- **Cleans package manager caches** for npm, yarn, and pnpm.
- **Reinstalls dependencies** using your preferred package manager (npm, yarn, or pnpm).

### Docker Operations (Only if Docker is Configured)

If your project includes either a `Dockerfile`, `docker-compose.yml`, or `docker-compose.yaml`, `torch` will also:

- **Stop and clean up Docker resources** (containers, images, volumes) if Docker is running.
- **Rebuild Docker images** from scratch.
- **Restart Docker services** in detached mode.

`torch` intelligently detects your project's configuration and only performs Docker operations when appropriate.

---

## Usage

### Install in your project

```bash
npm install torch-it --save-dev
```

### Run in npm scripts

Add a script to your project's `package.json`:

```json
{
  "scripts": {
    "torch": "torch",
    "torch:test": "torch --test"
  }
}
```

Then run:

```bash
npm run torch
```

### Run without adding scripts

```bash
npx torch
```

### Dry Run (`--test`)

Use `--test` to preview what `torch` would do without deleting directories, cleaning caches, installing dependencies, or changing Docker resources.

```bash
npx torch --test
```

---

## Requirements

### Core Requirements

- **Node.js** and a package manager (`npm`, `yarn`, or `pnpm`)

### Optional Requirements

- **Docker** (only needed if your project uses Docker)
- **Docker Compose** (only needed if your project uses Docker Compose)

---

## Customization

For project-level customization (recommended), create `torchrc.json` in your project root:

```json
{
  "customPaths": ["apps/web/.next", "services/api/tmp", ".turbo/cache", "coverage-final.json"]
}
```

`customPaths` supports both directories and files. Torch will remove these in the same cleanup pass as the built-in targets.


## Logging   

`torch` outputs information to the console and writes logs to `torch.log` in your project root so you can troubleshoot any issues and see what was removed and reinstalled.

## Troubleshooting

- If you see errors related to Docker, check:
  1. Is Docker installed and running?
  2. Does your project have Docker configuration files?
  3. Are your Docker configuration files valid?
- If you see errors about missing `package.json`, initialize your project with `npm init -y` or add your project files.
- For detailed information about any failures, check the `torch.log` file.
- `torch.log` is generated during runs and should be ignored by git to avoid accidental commits. Add this to your `.gitignore`:   

  ```gitignore
  torch.log
  ```

---

## License

MIT

---

**Happy torching!** 🔥✨
