import chalk from "chalk";

export const COLOURS = {
  BOLD: chalk.bold,
  CYAN: chalk.cyan,
  GREEN: chalk.green,
  RED: chalk.red,
  YELLOW: chalk.yellow,
  PURPLE: chalk.magenta,
  RESET: chalk.reset,
} as const;

export const ICONS = {
  INFO: "🔥",
  SUCCESS: "✅",
  FAIL: "❌",
  EXCLAMATION: "❗",
  WARN: "⚠️",
  ROCKET: "🔥",
  CLEAN: "🔥",
  PHOENIX: "🔥",
  BUILD: "🔨",
  TARGET: "🔥",
  CELEBRATE: "🔥",
  STARS: "✨",
  BOX: "📦",
  CLIPBOARD: "📋",
  DOCKER: "🐳",
} as const;
