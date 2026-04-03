import { resolvePresentationTokens } from "./presentation.js";
import { renderAlert } from "./render.js";
import { summarizeRunResult } from "./result-summary.js";
import { getExitCode, runCommand } from "./run.js";
import { detectTerminalCapabilities } from "./terminal.js";
import type { AlertLevel, AlertStyle, RenderAlertLine, TerminalCapabilities } from "./types.js";

export type { AlertLevel, AlertStyle, TerminalCapabilities };

export interface AlertOptions {
  level?: AlertLevel;
  style?: AlertStyle;
  bell?: boolean;
  noColor?: boolean;
}

export interface RunOptions {
  success?: string;
  error?: string;
  noSuccess?: boolean;
  noError?: boolean;
  style?: AlertStyle;
  bell?: boolean;
  noColor?: boolean;
}

export interface RunResult {
  exitCode: number;
  durationMs: number;
}

function writeOutput(output: string, bell: boolean): void {
  const suffix = bell ? "\u0007" : "";

  process.stdout.write(`${output}\n${suffix}`);
}

function buildLines(message: string): RenderAlertLine[] {
  return message.split("\n").map((text) => ({ text, variant: "primary" as const }));
}

export function alert(message: string, options: AlertOptions = {}): void {
  const level = options.level ?? "plain";
  const style = options.style ?? "box";
  const bell = options.bell ?? false;
  const terminal = detectTerminalCapabilities({ noColor: options.noColor ?? false });
  const tokens = resolvePresentationTokens(level, terminal);
  const output = renderAlert({
    style,
    lines: buildLines(message),
    width: terminal.width,
    truncateMarker: terminal.unicode ? "…" : "...",
    tokens,
  });

  writeOutput(output, bell);
}

export async function run(command: string[], options: RunOptions = {}): Promise<RunResult> {
  const style = options.style ?? "box";
  const bell = options.bell ?? false;
  const terminal = detectTerminalCapabilities({ noColor: options.noColor ?? false });

  const result = await runCommand(command);
  const summary = summarizeRunResult(result, {
    successMessage: options.success,
    errorMessage: options.error,
    showSuccess: !(options.noSuccess ?? false),
    showError: !(options.noError ?? false),
  });

  if (summary !== null) {
    const tokens = resolvePresentationTokens(summary.level, terminal);
    const output = renderAlert({
      style,
      lines: summary.lines,
      width: terminal.width,
      truncateMarker: terminal.unicode ? "…" : "...",
      tokens,
    });

    writeOutput(output, bell);
  }

  const exitCode = getExitCode(result);

  return { exitCode, durationMs: result.durationMs };
}
