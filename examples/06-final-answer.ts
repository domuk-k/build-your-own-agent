// ─────────────────────────────────────────────────────────────
// Example — Lesson 06: explicit termination with final_answer.
//
// Same runAgent(), but now the loop ends only when the model calls the
// built-in final_answer tool — not by guessing "it stopped using
// tools". Termination is a tool call, not a heuristic.
//
// Run it:  npm run example:06
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '7 * 6'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runAgent(
  "What is 7 * 6, then plus 8? Use the calculator, then give the final answer.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
