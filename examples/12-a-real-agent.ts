// ─────────────────────────────────────────────────────────────
// Example — Lesson 12: a real agent, end to end.
//
// The whole course in one run: a CodeAgent that plans in code, calls a
// tool in a loop, and returns a final answer — the "real agent" we
// built from the naked LLM call up.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:12
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runCodeAgent } from "../src/code-agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '7 / 3'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runCodeAgent(
  "A shop sells notebooks at 3 for $7. How much for 21 notebooks? " +
    "Then, rounding the per-notebook price to the nearest cent, how much " +
    "for 50 notebooks? Use the calculator for the arithmetic.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
