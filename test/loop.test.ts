import { test } from "node:test";
import assert from "node:assert/strict";
import { runSimpleAgent } from "../src/loop.ts";

test("runSimpleAgent loops until the model emits a FINAL ANSWER", async () => {
  const realFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";

  // Two scripted replies: the first keeps thinking, the second answers.
  const replies = ["Let me work through it...", "FINAL ANSWER: 42"];
  let i = 0;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: replies[i++] } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const answer = await runSimpleAgent("what is 6 times 7?");
    assert.equal(answer, "42");
    assert.equal(i, 2, "should have taken two turns");
  } finally {
    globalThis.fetch = realFetch;
  }
});
