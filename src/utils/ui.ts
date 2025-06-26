import { COLOURS, ICONS } from "../constants/constants";
import chalkInstance from "chalk";

function info(msg: string) {
  console.log(
    `${COLOURS.CYAN(ICONS.INFO)} ${COLOURS.BOLD(msg)}${COLOURS.RESET("")}`
  );
}
function success(msg: string) {
  console.log(`${COLOURS.GREEN(ICONS.SUCCESS)} ${msg}${COLOURS.RESET("")}`);
}
function warn(msg: string) {
  console.log(`${COLOURS.YELLOW(ICONS.WARN)} ${msg}${COLOURS.RESET("")}`);
}
function fail(msg: string) {
  console.log(`${COLOURS.RED(ICONS.FAIL)} ${msg}${COLOURS.RESET("")}`);
  process.exit(1);
}
function step(msg: string) {
  console.log(
    `\n${COLOURS.PURPLE("▶")} ${COLOURS.BOLD(msg)}${COLOURS.RESET("")}`
  );
}

function printBanner() {
  console.log(
    `             _______   \n` +
      "          _ ._  _ , _ ._\n" +
      "        (_ ' ( `  )_  .__)\n" +
      "      ( (  (    )   ` )  ) _)\n" +
      "     (__ (_   (_ . _) _) ,__)\n" +
      "         `~~'\\ ' . /'~~`\n" +
      "              ;   ;\n" +
      "              /   \\" +
      `\n` +
      "_______@@@@@_/_____\\_@@@@@_______" +
      "\n\n   What could possibly go wrong?\n"
  );
}

function printBox(
  lines: string[],
  color: typeof chalkInstance = COLOURS.GREEN
): void {
  const width = 56;
  const border = color("═".repeat(width));
  console.log(color("╔" + border + "╗"));
  lines.forEach((line) => {
    if (line.trim() === "") {
      console.log(color("║" + " ".repeat(width) + "║"));
    } else {
      const pad = width - line.length;
      console.log(color("║" + line + " ".repeat(pad) + "║"));
    }
  });
  console.log(color("╚" + border + "╝"));
}

export { info, success, warn, fail, step, printBanner, printBox };
