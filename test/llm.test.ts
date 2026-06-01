import { test } from "node:test";
import assert from "node:assert/strict";
import { callLLM } from "../src/llm.ts";

test("callLLM sends the messages and returns the assistant text", async () => {
  const realFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";

  // Stub the network so the test is offline and deterministic.
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String((init as RequestInit).body));
    assert.equal(body.messages[0].content, "hello");
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "hi there" } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const reply = await callLLM([{ role: "user", content: "hello" }]);
    assert.equal(reply, "hi there");
  } finally {
    globalThis.fetch = realFetch;
  }
});
