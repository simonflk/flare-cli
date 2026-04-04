import type { TerminalCapabilities, TerminalDebugInfo } from "./types.js";

const DEFAULT_WIDTH = 80;
const ATTENTION_FEATURE = "NOTIFICATIONS";
const OSC = "\u001B]";
const ST = "\u001B\\";
const BELL = "\u0007";

interface DetectTerminalCapabilitiesOptions {
  env?: NodeJS.ProcessEnv;
  noColor?: boolean;
  stdout?: Pick<NodeJS.WriteStream, "columns" | "isTTY">;
}

export interface AttentionPayload {
  title: string;
  body?: string;
  message: string;
}

function hasTermFeature(termFeatures: string | undefined, feature: string): boolean {
  if (!termFeatures) {
    return false;
  }

  return termFeatures.split(/[,\s]+/).some((part) => part.trim().toUpperCase() === feature);
}

function sanitizeOscText(value: string, allowSemicolons: boolean): string {
  const withoutControls = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint <= 0x1f || codePoint === 0x7f) {
      return " ";
    }

    return character;
  }).join("");
  const withoutTerminators = withoutControls.replaceAll("\u001B\\", " ");

  return withoutTerminators
    .replaceAll("\u001B", " ")
    .replaceAll("\u0007", " ")
    .replaceAll(";", allowSemicolons ? ";" : ":")
    .replace(/\s+/g, " ")
    .trim();
}

function detectAttentionMode(
  env: NodeJS.ProcessEnv,
  stdout: Pick<NodeJS.WriteStream, "isTTY">,
): Pick<TerminalDebugInfo, "attentionMode" | "attentionReason"> {
  const term = env.TERM ?? "";
  const termProgram = env.TERM_PROGRAM ?? "";

  if (!stdout.isTTY) {
    return { attentionMode: "bell", attentionReason: "not_tty" };
  }

  if (term === "dumb") {
    return { attentionMode: "bell", attentionReason: "dumb_terminal" };
  }

  if (hasTermFeature(env.TERM_FEATURES, ATTENTION_FEATURE)) {
    return { attentionMode: "osc9", attentionReason: "term_features_notifications" };
  }

  if (env.VTE_VERSION) {
    return { attentionMode: "osc777", attentionReason: "vte_version" };
  }

  if (
    env.KITTY_PID ||
    term.includes("kitty") ||
    term === "xterm-ghostty" ||
    env.GHOSTTY_RESOURCES_DIR ||
    termProgram === "iTerm.app" ||
    termProgram === "WezTerm"
  ) {
    return { attentionMode: "osc9", attentionReason: "known_osc9_terminal" };
  }

  return { attentionMode: "bell", attentionReason: "fallback_bell" };
}

export function getTerminalDebugInfo(
  options: DetectTerminalCapabilitiesOptions = {},
): TerminalDebugInfo {
  const env = options.env ?? process.env;
  const stdout = options.stdout ?? process.stdout;
  const isDumbTerminal = env.TERM === "dumb";
  const colorEnabled = Boolean(stdout.isTTY) && !options.noColor && env.NO_COLOR === undefined;
  const attention = detectAttentionMode(env, stdout);

  return {
    width: stdout.columns ?? DEFAULT_WIDTH,
    colorEnabled,
    unicode: !isDumbTerminal,
    isTTY: Boolean(stdout.isTTY),
    attentionMode: attention.attentionMode,
    attentionReason: attention.attentionReason,
    term: env.TERM,
    termProgram: env.TERM_PROGRAM,
    termFeatures: env.TERM_FEATURES,
    vteVersion: env.VTE_VERSION,
    hasKittyPid: Boolean(env.KITTY_PID),
    hasGhosttyResourcesDir: Boolean(env.GHOSTTY_RESOURCES_DIR),
    noColorRequested: Boolean(options.noColor),
    noColorEnv: env.NO_COLOR !== undefined,
  };
}

export function detectTerminalCapabilities(
  options: DetectTerminalCapabilitiesOptions = {},
): TerminalCapabilities {
  const debugInfo = getTerminalDebugInfo(options);

  return {
    width: debugInfo.width,
    colorEnabled: debugInfo.colorEnabled,
    unicode: debugInfo.unicode,
    isTTY: debugInfo.isTTY,
    attentionMode: debugInfo.attentionMode,
  };
}

export function renderAttentionSequence(
  payload: AttentionPayload,
  terminal: Pick<TerminalCapabilities, "attentionMode">,
): string {
  if (terminal.attentionMode === "osc9") {
    return `${OSC}9;${sanitizeOscText(payload.message, true)}${ST}`;
  }

  if (terminal.attentionMode === "osc777") {
    const title = sanitizeOscText(payload.title, false);
    const body = sanitizeOscText(payload.body ?? "", false);

    return `${OSC}777;notify;${title};${body}${ST}`;
  }

  return BELL;
}
