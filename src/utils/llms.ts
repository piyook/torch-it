import * as fs from "fs";
import * as path from "path";

const LLMS_FILE = "llms.txt";

// The file sits in the package root: one level above the bundled dist/torch-it.js,
// two above this file when run from source.
const findLlmsFile = (): string | undefined =>
  [
    path.join(__dirname, "..", LLMS_FILE),
    path.join(__dirname, "..", "..", LLMS_FILE),
  ].find((candidate) => fs.existsSync(candidate));

// The reference for AI agents and scripts, or undefined if it is not installed
export const readLlmsReference = (): string | undefined => {
  const file = findLlmsFile();
  return file ? fs.readFileSync(file, "utf8") : undefined;
};
