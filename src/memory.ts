// ─────────────────────────────────────────────────────────────
// Lesson 03 — Memory
//
// In Lesson 02 we kept a plain `Message[]` and pushed to it. That array
// WAS the agent's memory. Here we just give it a name and two tiny
// helpers so later lessons read clearly. Memory is plain data + plain
// functions — no class, nothing hidden.
// ─────────────────────────────────────────────────────────────

import type { Message } from "./types.ts";

/** The conversation so far. The agent's entire memory is this list. */
export type Memory = Message[];

/** Begin a memory with a system prompt as its first message. */
export function startMemory(systemPrompt: string): Memory {
  return [{ role: "system", content: systemPrompt }];
}

/** Append a message to the memory. */
export function remember(memory: Memory, message: Message): void {
  memory.push(message);
}
