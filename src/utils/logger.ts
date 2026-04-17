import fs from "fs";

let fileLoggingEnabled = true;

function stripAnsiCodes(text: string): string {
  const ansiRegex = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");
  return text.replace(ansiRegex, "");
}

export const setLoggerEnabled = (enabled: boolean): void => {
  fileLoggingEnabled = enabled;
};

export const clearLog = (): void => {
  if (!fileLoggingEnabled) {
    return;
  }
  fs.writeFileSync("torch-it.log", "");
};

export const logger = (message: string): void => {
  if (!fileLoggingEnabled) {
    return;
  }
  // Remove ansi codes and leading newline to make log look better
  const cleanMessage = stripAnsiCodes(message).replace(/^\n/, "");
  const timestamp = new Date().toISOString();
  fs.appendFileSync("torch-it.log", `[${timestamp}] ${cleanMessage}\n`);
};
