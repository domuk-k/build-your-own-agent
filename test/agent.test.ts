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

function toolCallResponse(id: string, name: string, args: unknown) {
  return {
    choices: [
      {
        message: {
          content: null,
          tool_calls: [
            { id, type: "function", function: { name, arguments: JSON.stringify(args) } },
          ],
        },
      },
    ],
  };
}

test("runAgent runs a tool, then ends when final_answer is called", async () => {
  const realFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";

  const responses = [
    toolCallResponse("c1", "add", { a: 2, b: 3 }), // turn 1: add(2,3)
    toolCallResponse("c2", "final_answer", { answer: "5" }), // turn 2: finish
  ];
  let i = 0;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(responses[i++]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const answer = await runAgent("what is 2+3?", [add]);
    assert.equal(answer, "5");
    assert.equal(i, 2, "should have taken two turns");
  } finally {
    globalThis.fetch = realFetch;
  }
});
