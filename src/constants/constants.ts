let colourEnabled = true;

export const setColourEnabled = (enabled: boolean): void => {
  colourEnabled = enabled;
};

const wrapAnsi = (start: string, end: string) => (text: string) =>
  colourEnabled ? `\u001b[${start}m${text}\u001b[${end}m` : text;

export const COLOURS = {
  BOLD: wrapAnsi("1", "22"),
  CYAN: wrapAnsi("36", "39"),
  GREEN: wrapAnsi("32", "39"),
  RED: wrapAnsi("31", "39"),
  YELLOW: wrapAnsi("33", "39"),
  PURPLE: wrapAnsi("35", "39"),
  RESET: (text: string) => (colourEnabled ? `\u001b[0m${text}` : text),
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
  WAIT: "⏳",
} as const;
