# 🚀 Project Nuke

A powerful, all-in-one shell script to **reset, clean, and rebuild** your Node.js (and Dockerized) project environments with a single command.

---

## What does `nuke.sh` do?

- **Stops and cleans up Docker resources** (containers, images, volumes) if Docker is running.
- **Removes build artifacts and cache directories** for common JavaScript/Node.js frameworks (e.g., `node_modules`, `dist`, `.next`, `.cache`, etc.).
- **Cleans package manager caches** for npm, yarn, and pnpm.
- **Reinstalls dependencies** using your preferred package manager (npm, yarn, or pnpm).
- **Rebuilds Docker images** (if Docker is available and configured).
- **Restarts Docker services** (if Docker Compose is configured).
- Provides a **clear, color-coded summary** of all actions taken.

---

## Usage

### 1. Make the script executable (first time only)

```bash
chmod +x nuke.sh
```

### 2. Run the script

```bash
./nuke.sh
```

The script will automatically:

- Detect your package manager and install dependencies.
- Clean up all build and cache directories.
- Handle Docker resources if Docker is running and configured.

---

## Requirements

- **Bash** (Linux, macOS, or Windows with Git Bash)
- **Node.js** and a package manager (`npm`, `yarn`, or `pnpm`)
- **Docker** (optional, for Docker cleanup and rebuild steps)

---

## Customization

You can edit the `BUILD_DIRS` and `CACHE_DIRS` arrays in `nuke.sh` to add or remove directories specific to your project or framework.

---

## Troubleshooting

- If you see errors related to Docker, make sure Docker Desktop is running.
- If you see errors about missing `package.json`, initialize your project with `npm init -y` or add your project files.
- Check the `nuke-it.log` file for detailed logs of each run.

---

## License

MIT

---

**Happy nuking!** 🧹✨
