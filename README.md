# 🚀 Project Nuke

A powerful, all-in-one script to **reset, clean, and rebuild** your Node.js (and optionally Dockerized) project environments with a single command.

---

## What does `nuke` do?

### Core Operations (Always Performed)

- **Removes build artifacts and cache directories** for common JavaScript/Node.js frameworks (e.g., `node_modules`, `dist`, `.next`, `.cache`, etc.).
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

You can edit the following arrays in `nuke.sh` or `nuke.ts` to customize the cleanup:

- `BUILD_DIRS`: Build output and artifact directories
- `CACHE_DIRS`: Cache directories for various tools

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
