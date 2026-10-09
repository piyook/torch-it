import { COLOURS, ICONS, setColourEnabled } from "../constants/constants";
import { logger } from "./logger";

// Plain output is for anything that is not a person at a terminal: no colour,
// emoji, banner or boxes, and a fixed prefix per line that a script can match.
let plain = false;
let quiet = false;

const PLAIN_PREFIXES: Record<string, string> = {
  success: "ok: ",
  warn: "warning: ",
  fail: "error: ",
  step: "> ",
};

function configureOutput(options: { plain?: boolean; quiet?: boolean }): void {
  plain = options.plain === true || process.stdout.isTTY !== true;
  quiet = options.quiet === true;
  setColourEnabled(!plain && !process.env.NO_COLOR);
}

const isQuiet = (): boolean => quiet;

// Runs fn with --quiet lifted, for output the user must see whatever was asked
function showInFull(fn: () => void): void {
  const wasQuiet = quiet;
  quiet = false;
  try {
    fn();
  } finally {
    quiet = wasQuiet;
  }
}

const ICON_PATTERN = new RegExp(
  `(?:${[...new Set(Object.values(ICONS))].join("|")})\\uFE0F? ?`,
  "gu",
);

const stripDecoration = (text: string): string =>
  text.replace(ICON_PATTERN, "").trimEnd();

function formatDecorated(msg: string, type: string): string {
  switch (type) {
    case "info":
      return `${COLOURS.CYAN(ICONS.INFO)} ${COLOURS.BOLD(msg)}${COLOURS.RESET("")}`;
    case "success":
      return `${COLOURS.GREEN(ICONS.SUCCESS)} ${msg}${COLOURS.RESET("")}`;
    case "warn":
      return `${COLOURS.YELLOW(ICONS.WARN)} ${msg}${COLOURS.RESET("")}`;
    case "fail":
      return `${COLOURS.RED(ICONS.FAIL)} ${msg}${COLOURS.RESET("")}`;
    case "step":
      return `\n${COLOURS.PURPLE("▶")} ${COLOURS.BOLD(msg)}${COLOURS.RESET("")}`;
    default:
      return msg;
  }
}

const formatPlain = (msg: string, type: string): string =>
  `${PLAIN_PREFIXES[type] ?? ""}${stripDecoration(msg).replace(/^\n+/, "")}`;

function outputToConsole(msg: string, type: string) {
  const message = plain ? formatPlain(msg, type) : formatDecorated(msg, type);
  logger(message);

  // Problems go to stderr, and are never silenced
  if (type === "warn" || type === "fail") {
    console.error(message);
  } else if (!quiet) {
    console.log(message);
  }
}

function printBanner() {
  if (plain || quiet) return;

  printBox(
    [`                  ${ICONS.TARGET} TORCH LIT ${ICONS.ROCKET}`],
    COLOURS.PURPLE,
  );
  const flame = `
) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )
  (( (( (( (( (( (( (( (( (( (( (( (( (( ((
 ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )
  (( (( (( (( (( (( (( (( (( (( (( (( (( ((
 ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) ) )
 ____  _   _ ____  _   _ ___ _   _  ____
| __ )| | | |  _ \\| \\ | |_ _| \\ | |/ ___|
|  _ \\| | | | |_) |  \\| || ||  \\| | |  _
| |_) | |_| |  _ <| |\\  || || |\\  | |_| |
|____/ \\___/|_| \\_\\_| \\_|___|_| \\_|\\____|
`;
  console.log(flame);
  logger(flame);
}

function printRisingFromAshesBanner() {
  if (plain || quiet) return;

  printBox(
    [`               ${ICONS.PHOENIX} RISING FROM THE ASHES ${ICONS.PHOENIX}`],
    COLOURS.PURPLE,
  );
}

function getVisibleLength(text: string): number {
  const ansiRegex = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");
  return text.replace(ansiRegex, "").length;
}

// The box is the end-of-run summary, so it is shown even with --quiet
function printBox(
  lines: string[],
  color: (text: string) => string = COLOURS.GREEN,
): void {
  if (plain) {
    lines
      .map(stripDecoration)
      .filter((line) => line.trim() !== "")
      .forEach((line) => {
        logger(line);
        console.log(line);
      });
    return;
  }

  console.log("");
  const width = Math.max(56, ...lines.map((line) => getVisibleLength(line)));
  const border = color("═".repeat(width));
  console.log(color("╔" + border + "╗"));
  lines.forEach((line) => {
    logger(line);
    if (line.trim() === "") {
      console.log(color("║" + " ".repeat(width) + "║"));
    } else {
      const pad = width - getVisibleLength(line);
      console.log(color("║" + line + " ".repeat(pad) + "║"));
    }
  });
  console.log(color("╚" + border + "╝"));
}

export {
  configureOutput,
  isQuiet,
  outputToConsole,
  printBanner,
  printBox,
  printRisingFromAshesBanner,
  showInFull,
};
