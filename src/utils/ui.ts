import { COLOURS, ICONS } from "../constants/constants";
import { logger } from "./logger";
function outputToConsole(msg: string, type: string) {
  let message;
  switch (type) {
    case "info":
      message = `${COLOURS.CYAN(ICONS.INFO)} ${COLOURS.BOLD(msg)}${COLOURS.RESET("")}`;

      break;
    case "success":
      message = `${COLOURS.GREEN(ICONS.SUCCESS)} ${msg}${COLOURS.RESET("")}`;
      break;
    case "warn":
      message = `${COLOURS.YELLOW(ICONS.WARN)} ${msg}${COLOURS.RESET("")}`;
      break;
    case "fail":
      message = `${COLOURS.RED(ICONS.FAIL)} ${msg}${COLOURS.RESET("")}`;
      break;
    case "step":
      message = `\n${COLOURS.PURPLE("▶")} ${COLOURS.BOLD(msg)}${COLOURS.RESET("")}`;
      break;
    default:
      message = msg;
  }
  console.log(message);
  logger(message);
}

function printBanner() {
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
  console.log("");
  printBox(
    [`               ${ICONS.PHOENIX} RISING FROM THE ASHES ${ICONS.PHOENIX}`],
    COLOURS.PURPLE,
  );
}

function getVisibleLength(text: string): number {
  const ansiRegex = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");
  return text.replace(ansiRegex, "").length;
}

function printBox(
  lines: string[],
  color: (text: string) => string = COLOURS.GREEN,
): void {
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

export { outputToConsole, printBanner, printBox, printRisingFromAshesBanner };
