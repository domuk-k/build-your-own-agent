import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { runCodeAgent } from "../src/code-agent.ts";
import type { Tool } from "../src/types.ts";

const add: Tool = {
  name: "add",
  description: "Add two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
  run: (args) => String(args.a + args.b),
};

test("runCodeAgent runs model-written code that calls a tool and finishes", async () => {
  const realFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";

  const reply =
    "Here is my solution:\n```js\n" +
    "const sum = await add({ a: 2, b: 3 });\n" +
    "final_answer(sum);\n" +
    "```";
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const answer = await runCodeAgent("add 2 and 3", [add]);
    assert.equal(answer, "5");
  } finally {
    globalThis.fetch = realFetch;
  }
});
