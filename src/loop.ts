// ─────────────────────────────────────────────────────────────
// Lesson 02 — The Loop
//
// This is the whole idea of an agent: call the model, look at its
// reply, and decide whether to stop or go again. No tools yet — just
// the loop. In Lesson 05 this same loop grows the ability to call
// tools, but the skeleton never changes.
//
// Notice: the conversation is a plain array we keep appending to.
// That array IS the agent's memory (we give it a name in Lesson 03).
// ─────────────────────────────────────────────────────────────

import type { Message } from "./types.ts";
import { callLLM } from "./llm.ts";

const MAX_TURNS = 5;
const FINAL_MARKER = "FINAL ANSWER:";

/** Run the model in a loop until it declares a final answer. */
export async function runSimpleAgent(task: string): Promise<string> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "Solve the task by reasoning step by step. " +
        `When you are confident, reply with a line starting with "${FINAL_MARKER}".`,
    },
    { role: "user", content: task },
  ];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const reply = await callLLM(messages);
    messages.push({ role: "assistant", content: reply });

    const at = reply.indexOf(FINAL_MARKER);
    if (at !== -1) {
      return reply.slice(at + FINAL_MARKER.length).trim();
    }

    // Not done yet — nudge the model to keep going, then loop again.
    messages.push({ role: "user", content: "Continue." });
  }

  throw new Error(`No final answer after ${MAX_TURNS} turns.`);
}
