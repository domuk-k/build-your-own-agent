// ─────────────────────────────────────────────────────────────
// Example — Lesson 01: the naked LLM call.
//
// An LLM is just one HTTP request. callLLM() POSTs the conversation
// and hands back one string. That is the whole "model" we build on.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:01
// ─────────────────────────────────────────────────────────────

import { callLLM } from "../src/llm.ts";
import type { Message } from "../src/types.ts";

const messages: Message[] = [
  { role: "system", content: "You are a terse assistant. Answer in one sentence." },
  { role: "user", content: "In plain words, what is a large language model?" },
];

const reply = await callLLM(messages);
console.log("\n=== MODEL REPLY ===\n" + reply);
