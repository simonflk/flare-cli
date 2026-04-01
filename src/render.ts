import { styleText } from "node:util";

import type { AlertTextStyle, RenderAlertInput } from "./types.js";

function applyStyles(text: string, styles: AlertTextStyle[]): string {
  if (styles.length === 0) {
    return text;
  }

  return styleText(styles, text);
}

function toContentLines(message: string, icon: string): string[] {
  const [firstLine, ...remainingLines] = message.split("\n");

  return [`${icon} ${firstLine}`, ...remainingLines.map((line) => `  ${line}`)];
}

export function renderAlert(input: RenderAlertInput): string {
  if (input.style !== "box") {
    throw new Error(`Unsupported alert style: ${input.style}`);
  }

  const contentLines = toContentLines(input.message, input.tokens.icon);
  const contentWidth = Math.max(...contentLines.map((line) => line.length));
  const horizontal = "─".repeat(contentWidth + 2);

  const top = `┌${horizontal}┐`;
  const body = contentLines.map((line) => `│ ${line.padEnd(contentWidth, " ")} │`);
  const bottom = `└${horizontal}┘`;

  return [top, ...body, bottom].map((line) => applyStyles(line, input.tokens.styles)).join("\n");
}
