import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { runCode } from "../src/sandbox.ts";
import type { Tool } from "../src/types.ts";

const add: Tool = {
  name: "add",
  description: "Add two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
  run: (args) => String(args.a + args.b),
};

test("runCode runs JS, awaits a tool, and captures final_answer", async () => {
  const code = `
    const sum = await add({ a: 2, b: 3 });
    print("sum is", sum);
    final_answer(sum);
  `;
  const result = await runCode(code, [add]);
  assert.equal(result.finalAnswer, "5");
  assert.deepEqual(result.logs, ["sum is 5"]);
});
