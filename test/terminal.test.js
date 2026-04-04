import test from "node:test";
import assert from "node:assert/strict";

import {
  detectTerminalCapabilities,
  getTerminalDebugInfo,
  renderAttentionSequence,
} from "../.test-dist/terminal.js";

test("detectTerminalCapabilities prefers OSC 9 when notifications are advertised", () => {
  const terminal = detectTerminalCapabilities({
    env: {
      TERM: "xterm-256color",
      TERM_FEATURES: "COLORS,NOTIFICATIONS",
    },
    stdout: {
      columns: 80,
      isTTY: true,
    },
  });

  assert.equal(terminal.attentionMode, "osc9");
});

test("detectTerminalCapabilities uses OSC 777 for VTE terminals", () => {
  const terminal = detectTerminalCapabilities({
    env: {
      TERM: "xterm-256color",
      VTE_VERSION: "7600",
    },
    stdout: {
      columns: 80,
      isTTY: true,
    },
  });

  assert.equal(terminal.attentionMode, "osc777");
});

test("detectTerminalCapabilities falls back to BEL when no notification protocol is known", () => {
  const terminal = detectTerminalCapabilities({
    env: {
      TERM: "xterm-256color",
    },
    stdout: {
      columns: 80,
      isTTY: true,
    },
  });

  assert.equal(terminal.attentionMode, "bell");
});

test("getTerminalDebugInfo reports the attention reason and environment markers", () => {
  const terminal = getTerminalDebugInfo({
    env: {
      TERM: "xterm-256color",
      TERM_PROGRAM: "WezTerm",
    },
    stdout: {
      columns: 120,
      isTTY: true,
    },
  });

  assert.equal(terminal.attentionMode, "osc9");
  assert.equal(terminal.attentionReason, "known_osc9_terminal");
  assert.equal(terminal.termProgram, "WezTerm");
  assert.equal(terminal.width, 120);
});

test("renderAttentionSequence formats OSC 9, OSC 777, and BEL payloads", () => {
  const payload = {
    title: "✓ Command succeeded",
    body: "npm test",
    message: "✓ Command succeeded - npm test",
  };

  assert.equal(
    renderAttentionSequence(payload, { attentionMode: "osc9" }),
    "\u001B]9;✓ Command succeeded - npm test\u001B\\",
  );
  assert.equal(
    renderAttentionSequence(payload, { attentionMode: "osc777" }),
    "\u001B]777;notify;✓ Command succeeded;npm test\u001B\\",
  );
  assert.equal(renderAttentionSequence(payload, { attentionMode: "bell" }), "\u0007");
});
