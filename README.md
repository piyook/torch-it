# 🔥 Torch It

A powerful, all-in-one TypeScript tool to **reset, clean, and rebuild** your Node.js (and optionally Dockerized) project environments with a single command.

---

## What does `torch it` do?

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

### TypeScript/JavaScript Version (`torch.ts`/`torch.js`)

1. Install dependencies (first time only):
   ```bash
   npm install
   ```
2. To run directly with TypeScript (no build step):
   ```bash
   npm run torch:ts
   ```
3. To build and run the compiled JavaScript:
   ```bash
   npm run build
   npm run torch
   ```

### Dry Run (`--test`)

Use `--test` to preview what `torch` would do without deleting directories, cleaning caches, installing dependencies, or changing Docker resources.

```bash
npm run torch:ts -- --test
```

Or with compiled output:

```bash
npm run build
node dist/torch.js --test
```

---

## Requirements

### Core Requirements

- **Node.js** and a package manager (`npm`, `yarn`, or `pnpm`) for `torch.ts`/`torch.js`

### Optional Requirements

- **Docker** (only needed if your project uses Docker)
- **Docker Compose** (only needed if your project uses Docker Compose)

---

## Customization

You can edit cleanup arrays in `src/constants/config.ts`:

- `BUILD_DIRS`: Common framework build output and artifact directories
- `CACHE_DIRS`: Cache directories for package managers and tooling
- `CUSTOM_DIRS`: Project-specific files/directories you want deleted during torch

Example `CUSTOM_DIRS` entries:

```ts
export const CUSTOM_DIRS = [
  "apps/web/.next",
  "services/api/tmp",
  "generated",
] as const;
```

When `CUSTOM_DIRS` contains paths, `torch` will attempt to remove them in the same cleanup pass as build/cache directories.

---

## Troubleshooting

- If you see errors related to Docker, check:
  1. Is Docker installed and running?
  2. Does your project have Docker configuration files?
  3. Are your Docker configuration files valid?
- If you see errors about missing `package.json`, initialize your project with `npm init -y` or add your project files.
- For detailed information about any failures, check the `torch.log` file.

---

## License

MIT

---

**Happy torching!** 🔥✨
