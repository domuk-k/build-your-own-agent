import { test } from "node:test";
import assert from "node:assert/strict";
import { startMemory, remember } from "../src/memory.ts";

test("startMemory puts the system prompt first", () => {
  const memory = startMemory("be helpful");
  assert.equal(memory[0].role, "system");
  assert.equal(memory[0].content, "be helpful");
});

test("remember appends messages in order", () => {
  const memory = startMemory("sys");
  remember(memory, { role: "user", content: "hi" });
  remember(memory, { role: "assistant", content: "hello" });
  assert.deepEqual(
    memory.map((m) => m.content),
    ["sys", "hi", "hello"],
  );
});
