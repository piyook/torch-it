# 🚀 Project Nuke

A powerful, all-in-one script to **reset, clean, and rebuild** your Node.js (and optionally Dockerized) project environments with a single command.

---

## What does `nuke` do?

### Core Operations (Always Performed)

- **Removes build artifacts and cache directories** for common JavaScript/Node.js frameworks (e.g., `node_modules`, `dist`, `.next`, `.cache`, etc.).
- **Removes custom directories/paths** that you define in `CUSTOM_DIRS`.
- **Cleans package manager caches** for npm, yarn, and pnpm.
- **Reinstalls dependencies** using your preferred package manager (npm, yarn, or pnpm).

### Docker Operations (Only if Docker is Configured)

If your project includes either a `Dockerfile`, `docker-compose.yml`, or `docker-compose.yaml`, the script will also:

- **Stop and clean up Docker resources** (containers, images, volumes) if Docker is running.
- **Rebuild Docker images** from scratch.
- **Restart Docker services** in detached mode.

The script intelligently detects your project's configuration and only performs Docker operations when appropriate.

---

## Usage

> **Note:** You can use either the Bash script (`nuke.sh`) or the TypeScript/JavaScript version (`nuke.ts`/`nuke.js`).
>
> On Windows, use [Git Bash](https://gitforwindows.org/) or [WSL](https://docs.microsoft.com/en-us/windows/wsl/) to run `nuke.sh`. PowerShell and CMD are not supported for the Bash script.

### Option 1: Bash Script (`nuke.sh`)

1. Make the script executable (first time only):
   ```bash
   chmod +x nuke.sh
   ```
2. Run the script:
   ```bash
   ./nuke.sh
   ```

### Option 2: TypeScript/JavaScript Version (`nuke.ts`/`nuke.js`)

1. Install dependencies (first time only):
   ```bash
   npm install
   ```
2. To run directly with TypeScript (no build step):
   ```bash
   npm run nuke:ts
   ```
3. To build and run the compiled JavaScript:
   ```bash
   npm run build
   npm run nuke
   ```

### Dry Run (`--test`)

Use `--test` to preview what `nuke` would do without deleting directories, cleaning caches, installing dependencies, or changing Docker resources.

```bash
npm run nuke:ts -- --test
```

Or with compiled output:

```bash
npm run build
node dist/nuke.js --test
```

---

## Requirements

### Core Requirements

- **Bash** (Linux, macOS, or Windows with Git Bash) for `nuke.sh`
- **Node.js** and a package manager (`npm`, `yarn`, or `pnpm`) for `nuke.ts`/`nuke.js`

### Optional Requirements

- **Docker** (only needed if your project uses Docker)
- **Docker Compose** (only needed if your project uses Docker Compose)

---

## Customization

You can edit cleanup arrays in `src/constants/config.ts`:

- `BUILD_DIRS`: Common framework build output and artifact directories
- `CACHE_DIRS`: Cache directories for package managers and tooling
- `CUSTOM_DIRS`: Project-specific files/directories you want deleted during nuke

Example `CUSTOM_DIRS` entries:

```ts
export const CUSTOM_DIRS = [
  "apps/web/.next",
  "services/api/tmp",
  "generated",
] as const;
```

When `CUSTOM_DIRS` contains paths, `nuke` will attempt to remove them in the same cleanup pass as build/cache directories.

---

## Troubleshooting

- If you see errors related to Docker, check:
  1. Is Docker installed and running?
  2. Does your project have Docker configuration files?
  3. Are your Docker configuration files valid?
- If you see errors about missing `package.json`, initialize your project with `npm init -y` or add your project files.
- For detailed information about any failures, check the `nuke-it.log` file.

---

## License

MIT

---

**Happy nuking!** 🧹✨
