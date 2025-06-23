# 🚀 Project Nuke

A powerful, all-in-one shell script to **reset, clean, and rebuild** your Node.js (and optionally Dockerized) project environments with a single command.

---

## What does `nuke.sh` do?

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

> **Note:** This script is designed for Bash environments.
>
> On Windows, use [Git Bash](https://gitforwindows.org/) or [WSL](https://docs.microsoft.com/en-us/windows/wsl/) to run `nuke.sh`.
>
> Running the script in PowerShell or Command Prompt is not supported and will result in errors.

### 1. Make the script executable (first time only)

```bash
chmod +x nuke.sh
```

### 2. Run the script

```bash
./nuke.sh
```

Or via npm:

```bash
npm run nuke
```

The script will automatically:

- Detect and use your package manager (npm, yarn, or pnpm)
- Clean up all build and cache directories
- Handle Docker resources if Docker is configured and running

---

## Requirements

### Core Requirements

- **Bash** (Linux, macOS, or Windows with Git Bash)
- **Node.js** and a package manager (`npm`, `yarn`, or `pnpm`)

### Optional Requirements

- **Docker** (only needed if your project uses Docker)
- **Docker Compose** (only needed if your project uses Docker Compose)

---

## Customization

You can edit the following arrays in `nuke.sh` to customize the cleanup:

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
