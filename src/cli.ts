#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { alert, run } from "./index.js";
import { parseArgv, validateCommand } from "./parser.js";
import { getTerminalDebugInfo } from "./terminal.js";

const HELP_TEXT = `Usage:
  flareup [<status>] [<message>] [flags]
  flareup run [--success <msg>] [--error <msg>] [--no-success] [--no-error] [flags] -- <command...>
  flareup --debug-terminal

Statuses:
  success, error, warn, info, debug

Flags:
  --style <name>, -s <name>  box | banner | callout | line | minimal | panel
  --notify, -n              Trigger terminal attention (OSC 9 / OSC 777 / BEL)
  --bell, -b                Play a terminal bell character
  --debug-terminal, -d      Print detected terminal info to stderr
  --no-color
  --help
  --version`;

function writeTerminalDebugInfo(noColor: boolean): void {
  const debugInfo = getTerminalDebugInfo({ noColor });
  const lines = [
    "Terminal Debug",
    `width: ${debugInfo.width}`,
    `color_enabled: ${debugInfo.colorEnabled}`,
    `unicode: ${debugInfo.unicode}`,
    `is_tty: ${debugInfo.isTTY}`,
    `attention_mode: ${debugInfo.attentionMode}`,
    `attention_reason: ${debugInfo.attentionReason}`,
    `term: ${debugInfo.term ?? "(unset)"}`,
    `term_program: ${debugInfo.termProgram ?? "(unset)"}`,
    `term_features: ${debugInfo.termFeatures ?? "(unset)"}`,
    `vte_version: ${debugInfo.vteVersion ?? "(unset)"}`,
    `has_kitty_pid: ${debugInfo.hasKittyPid}`,
    `has_ghostty_resources_dir: ${debugInfo.hasGhosttyResourcesDir}`,
    `no_color_requested: ${debugInfo.noColorRequested}`,
    `no_color_env: ${debugInfo.noColorEnv}`,
  ];

  process.stderr.write(`${lines.join("\n")}\n`);
}

async function readPackageVersion(): Promise<string> {
  const packageJsonPath = new URL("../package.json", import.meta.url);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as { version: string };

  return packageJson.version;
}

async function main(): Promise<void> {
  const command = validateCommand(parseArgv(process.argv.slice(2)));

  if (command.kind === "help") {
    process.stdout.write(`${HELP_TEXT}\n`);
    return;
  }

  if (command.kind === "version") {
    process.stdout.write(`${await readPackageVersion()}\n`);
    return;
  }

  if (command.debugTerminal) {
    writeTerminalDebugInfo(command.noColor);
  }

  if (command.kind === "direct" && command.debugTerminal && !command.message) {
    return;
  }

  if (command.kind === "run") {
    const result = await run(command.command, {
      success: command.successMessage,
      error: command.errorMessage,
      noSuccess: !command.showSuccess,
      noError: !command.showError,
      style: command.style,
      bell: command.bell,
      notify: command.notify,
      noColor: command.noColor,
    });

    process.exitCode = result.exitCode;
    return;
  }

  alert(command.message!, {
    level: command.level,
    style: command.style,
    bell: command.bell,
    notify: command.notify,
    noColor: command.noColor,
  });
}

void main();
