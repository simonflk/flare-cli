import test from "node:test";
import assert from "node:assert/strict";

import { renderAlert } from "../.test-dist/render.js";

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-9;]*m/g, "");
}

test("box style renders three lines with box borders", () => {
  const output = stripAnsi(
    renderAlert({
      style: "box",
      message: "hello",
      width: 80,
      tokens: {
        icon: "●",
        styles: [],
      },
    }),
  );

  const lines = output.split("\n");

  assert.equal(lines.length, 3);
  assert.match(lines[0], /^┌.*┐$/);
  assert.match(lines[1], /^│ .* │$/);
  assert.match(lines[2], /^└.*┘$/);
  assert.match(lines[1], /● hello/);
});
