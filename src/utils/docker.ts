import * as fs from "fs";
function hasDockerFiles(): boolean {
  return (
    fs.existsSync("Dockerfile") ||
    fs.existsSync("docker-compose.yml") ||
    fs.existsSync("docker-compose.yaml")
  );
}

export { hasDockerFiles };
