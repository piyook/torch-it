import { ICONS } from "../constants/constants";
import { printBox } from "./ui";
import type { TorchRecord } from "../types";

const statusMessage = (torchRecord: TorchRecord) => {
  let dockerRemoved = ``;
  let dockerBuild = ``;
  let dockerLaunch = ``;

  if (torchRecord.dockerClean === "NO_DOCKER") {
    dockerRemoved = `${ICONS.DOCKER} No Docker containers found`;
  } else if (torchRecord.dockerClean === "DOCKER_FAIL") {
    dockerRemoved = `${ICONS.FAIL} Failed to remove Docker containers`;
  }

  if (torchRecord.dockerClean === "OK") {
    if (torchRecord.dockerRebuild) {
      dockerBuild = `${ICONS.DOCKER} Docker containers rebuilt from scratch`;
    } else {
      dockerBuild = `${ICONS.FAIL} Failed to rebuild Docker containers`;
    }

    if (torchRecord.dockerLaunch && torchRecord.dockerRebuild) {
      dockerLaunch = `${ICONS.ROCKET} Services running in detached mode`;
    } else {
      dockerLaunch = `${ICONS.FAIL} Failed to start Docker containers`;
    }
  }

  const buildAndCache =
    torchRecord.buildAndCacheClean && torchRecord.packageManagerClean
      ? `${ICONS.CLEAN} All build artifacts & caches removed`
      : `${ICONS.FAIL} Build artifacts or cache directories not found`;

  const dependencies = torchRecord.dependencyInstall
    ? `${ICONS.BOX} Dependencies freshly installed`
    : `${ICONS.FAIL} Failed to install dependencies`;

  console.log("");
  printBox([
    "🔥 PROJECT SUCCESSFULLY TORCHED! 🔥",
    "",
    `${buildAndCache}`,
    `${dependencies}`,
    `${dockerRemoved}`,
    `${dockerBuild}`,
    `${dockerLaunch}`,
    "",
    torchRecord.logfile === false
      ? `${ICONS.CLIPBOARD} Logging to torch-it.log is disabled; set "logfile": true in torchrc.json to enable it`
      : `${ICONS.CLIPBOARD} Check torch-it.log for detailed logs`,
  ]);
};

export { statusMessage };
