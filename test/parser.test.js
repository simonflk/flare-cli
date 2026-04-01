import test from "node:test";
import assert from "node:assert/strict";

import { parseArgv, validateCommand } from "../.test-dist/parser.js";

test("parseArgv extracts the direct message", () => {
  const command = validateCommand(parseArgv(["hello"]));

  assert.equal(command.kind, "direct");
  assert.equal(command.level, "plain");
  assert.equal(command.style, "box");
  assert.equal(command.message, "hello");
});

test("validateCommand throws when the message is missing", () => {
  assert.throws(() => validateCommand(parseArgv([])), /message is required/i);
});
