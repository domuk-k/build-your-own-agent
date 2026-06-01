// ─────────────────────────────────────────────────────────────
// Example — Lesson 03: name the memory.
//
// Memory IS the message list. startMemory() seeds it with a system
// prompt; remember() appends. We build a short conversation, then hand
// the whole memory to callLLM() and watch the model recall it.
//
// Run it:  npm run example:03
// ─────────────────────────────────────────────────────────────

import { startMemory, remember } from "../src/memory.ts";
import { callLLM } from "../src/llm.ts";

const memory = startMemory("You are a helpful assistant with a good memory.");
remember(memory, { role: "user", content: "My name is Dwk and I like trains." });
remember(memory, { role: "assistant", content: "Nice to meet you, Dwk!" });
remember(memory, { role: "user", content: "What is my name, and what do I like?" });

const reply = await callLLM(memory);
console.log("\n=== MODEL RECALLS ===\n" + reply);
