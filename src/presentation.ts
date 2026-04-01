import type { AlertLevel, AlertPresentationTokens, TerminalCapabilities } from "./types.js";

export function resolvePresentationTokens(
  level: AlertLevel,
  terminal: TerminalCapabilities,
): AlertPresentationTokens {
  if (level !== "plain") {
    throw new Error(`Unsupported alert level: ${level}`);
  }

  return {
    icon: terminal.unicode ? "●" : "*",
    styles: ["bold"],
  };
}
