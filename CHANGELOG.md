# Changelog

Notable changes to torch-it. Versions follow [semantic versioning](https://semver.org/). Releases before 3.0.0 are described on the [GitHub releases page](https://github.com/piyook/torch-it/releases).

## 3.0.0 - 2026-10-09

Version 3 closes several ways a run could delete more than intended, and makes torch-it easier to drive from scripts and AI agents. Some behaviour has changed: see [Upgrading from 2.x](README.md#upgrading-from-2x) for what to do about each change.

### Breaking changes

- With no terminal (CI, pipes) and no `--yes`, nothing is deleted and the exit code is `1`. Before, it deleted without asking.
- Exit codes now have meanings: `0` success, `1` nothing was changed, `2` a step failed, `3` cancelled at the prompt. Answering no at the prompt used to exit with `0`.
- An invalid `torchrc.json`, an unknown option or a value of the wrong type stops the run. Before, it was ignored.
- Files tracked in git are kept, even inside a target such as `build`. Pass `--allowTracked=true` to delete them.
- `lib`, `es`, `cjs` and `umd` are no longer deleted by default. Add them to `customPaths` if your build writes to them.
- A `customPaths` entry that is the project root or outside it is refused.
- Docker mode no longer removes volumes unless `dockerVolumes` is `true`.
- Docker mode needs a Compose file. A `Dockerfile` alone is skipped.
- Only the cache of the package manager the project uses is cleaned, not every one installed.
- Output that is not going to a terminal is plain text, and warnings and errors go to stderr.
- Node.js 20 or later is required.

### Added

- `--json` prints one result object: what was removed, what failed, what was kept, and the outcome of each step.
- `--llms` prints `llms.txt`, the reference for AI agents and scripts. The file now ships in the npm package.
- `--only` limits a run to the paths given.
- `--cacheClean=false` skips the package manager cache clean.
- `--cwd` runs torch-it in another directory.
- `--quiet`, `--plain` and `NO_COLOR` control the output. Plain lines start with `ok:`, `warning:` or `error:`.
- `compose.yaml` and `compose.yml` are recognised as Compose files.
- List flags take comma-separated paths: `--customPaths=temp,logs`. The quoted JSON form still works.

### Fixed

- Protected and custom paths given on the command line were ignored. They are now used, and merged with the lists in `torchrc.json`.
- A protected path written with a trailing slash, `./` or different letter case was not protected.
- `*.log` also matched root files such as `catalog.json`. File patterns now match the extension only, and only in the project root.
- A symlink that leads to a protected path is skipped instead of followed.
- A path that could not be removed was reported as cleaned. It is now listed as failed and the exit code is `2`.
- When Docker mode was on and Docker was not running, the run reported success.
- The log file could delete itself, or be cut short, during a run.
- The preview shown before confirming now matches what the run removes.

### Changed

- Dependencies are updated, including TypeScript 7 and vitest 5. `tsx` replaces `ts-node` for running from source.
- `fallow` runs in the pre-push hook and in CI, and CI also runs on the `dev` branch.
