import type { TerminalCapabilities } from "./types.js";

const DEFAULT_WIDTH = 80;

export function detectTerminalCapabilities(
  stdout: Pick<NodeJS.WriteStream, "columns" | "isTTY"> = process.stdout,
): TerminalCapabilities {
  return {
    width: stdout.columns ?? DEFAULT_WIDTH,
    colorEnabled: Boolean(stdout.isTTY),
    unicode: true,
    isTTY: Boolean(stdout.isTTY),
    bellSupported: Boolean(stdout.isTTY),
  };
}
