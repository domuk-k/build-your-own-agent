// ─────────────────────────────────────────────────────────────
// Lesson 02 — The Loop   (updated in Lesson 03 to use named Memory)
//
// This is the whole idea of an agent: call the model, look at its
// reply, and decide whether to stop or go again. No tools yet — just
// the loop. In Lesson 05 this same loop grows the ability to call
// tools, but the skeleton never changes.
// ─────────────────────────────────────────────────────────────

import { callLLM } from "./llm.ts";
import { startMemory, remember } from "./memory.ts";

const MAX_TURNS = 5;
const FINAL_MARKER = "FINAL ANSWER:";

/** Run the model in a loop until it declares a final answer. */
export async function runSimpleAgent(task: string): Promise<string> {
  const memory = startMemory(
    "Solve the task by reasoning step by step. " +
      `When you are confident, reply with a line starting with "${FINAL_MARKER}".`,
  );
  remember(memory, { role: "user", content: task });

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const reply = await callLLM(memory);
    remember(memory, { role: "assistant", content: reply });

    const at = reply.indexOf(FINAL_MARKER);
    if (at !== -1) {
      return reply.slice(at + FINAL_MARKER.length).trim();
    }

    // Not done yet — nudge the model to keep going, then loop again.
    remember(memory, { role: "user", content: "Continue." });
  }

  throw new Error(`No final answer after ${MAX_TURNS} turns.`);
}
