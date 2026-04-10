import { ICONS } from "../constants/constants";
import { printBox } from "./ui";
import type { NukeRecord } from "../types";

const statusMessage = (nukeRecord: NukeRecord) => {
  let dockerRemoved = ``;
  let dockerBuild = ``;
  let dockerLaunch = ``;

  if (nukeRecord.dockerClean === "NO_DOCKER") {
    dockerRemoved = `${ICONS.DOCKER} No Docker containers found`;
  } else if (nukeRecord.dockerClean === "DOCKER_FAIL") {
    dockerRemoved = `${ICONS.FAIL} Failed to remove Docker containers`;
  }

  if (nukeRecord.dockerClean === "OK") {
    if (nukeRecord.dockerRebuild) {
      dockerBuild = `${ICONS.DOCKER} Docker containers rebuilt from scratch`;
    } else {
      dockerBuild = `${ICONS.FAIL} Failed to rebuild Docker containers`;
    }

    if (nukeRecord.dockerLaunch && nukeRecord.dockerRebuild) {
      dockerLaunch = `${ICONS.ROCKET} Services running in detached mode`;
    } else {
      dockerLaunch = `${ICONS.FAIL} Failed to start Docker containers`;
    }
  }

  const buildAndCache =
    nukeRecord.buildAndCacheClean && nukeRecord.packageManagerClean
      ? `${ICONS.CLEAN} All build artifacts & caches removed`
      : `${ICONS.FAIL} Build artifacts or cache directories not found`;

  const dependencies = nukeRecord.dependencyInstall
    ? `${ICONS.BOX} Dependencies freshly installed`
    : `${ICONS.FAIL} Failed to install dependencies`;

  console.log("");
  printBox([
    "🎉 PROJECT SUCCESSFULLY NUKED! 🎉",
    "",
    `${buildAndCache}`,
    `${dependencies}`,
    `${dockerRemoved}`,
    `${dockerBuild}`,
    `${dockerLaunch}`,
    "",
    `${ICONS.CLIPBOARD} Check nuke-it.log for detailed logs`,
  ]);
};

export { statusMessage };
