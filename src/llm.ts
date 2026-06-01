// ─────────────────────────────────────────────────────────────
// Lesson 01 — The Naked Call
//
// An LLM is just an HTTP request. No SDK, no magic: we POST the
// conversation and read back one string. This single function is the
// only place in the whole project that talks to the network.
// ─────────────────────────────────────────────────────────────

import type { Message } from "./types.ts";

// Any OpenAI-compatible endpoint works: OpenAI, OpenRouter, Vercel AI
// Gateway, a local server. Override OPENAI_BASE_URL to point elsewhere —
// e.g. https://openrouter.ai/api/v1 with a free model in OPENAI_MODEL.
const BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

/** Send the conversation to the model and return its reply text. */
export async function callLLM(messages: Message[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY (see .env.example)");

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
