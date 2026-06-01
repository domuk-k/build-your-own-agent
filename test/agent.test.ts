import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const add: Tool = {
  name: "add",
  description: "Add two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
  run: (args) => String(args.a + args.b),
};

test("runAgent calls a tool, feeds the result back, then answers", async () => {
  const realFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";

  const responses = [
    // turn 1: the model asks to call add(2, 3)
    {
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: "c1",
                type: "function",
                function: { name: "add", arguments: JSON.stringify({ a: 2, b: 3 }) },
              },
            ],
          },
        },
      ],
    },
    // turn 2: with the result in memory, the model answers in words
    { choices: [{ message: { content: "The answer is 5." } }] },
  ];

  let i = 0;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(responses[i++]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const answer = await runAgent("what is 2+3?", [add]);
    assert.equal(answer, "The answer is 5.");
    assert.equal(i, 2, "should have taken two turns");
  } finally {
    globalThis.fetch = realFetch;
  }
});
