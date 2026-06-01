import { test } from "node:test";
import assert from "node:assert/strict";
import { logStep } from "../src/monitor.ts";

test("logStep prints the label and the detail", () => {
  const realLog = console.log;
  let captured = "";
  console.log = (msg?: unknown) => {
    captured = String(msg);
  };
  try {
    logStep("tool", "add({a:2})");
  } finally {
    console.log = realLog;
  }
  assert.match(captured, /tool/);
  assert.match(captured, /add/);
});
