// ─────────────────────────────────────────────────────────────
// Example — Lesson 08: monitor the agent's steps.
//
// logStep() is wired into the loop, so each turn (the model's tool
// calls and their results) prints as the agent works. Run it and watch
// the trace appear before the final answer.
//
// Run it:  npm run example:08
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '(12 + 8) * 3'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runAgent(
  "Compute (12 + 8) * 3 step by step with the calculator.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
