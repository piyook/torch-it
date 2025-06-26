import fs from "fs";

function stripAnsiCodes(text: string): string {
  // oxlint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

export const logger = (message: string): void => {
  // Remove ansi codes and leading newline to make log look better
  const cleanMessage = stripAnsiCodes(message).replace(/^\n/, "");
  const timestamp = new Date().toISOString();
  fs.appendFileSync("nuke.log", `[${timestamp}] ${cleanMessage}\n`);
};
