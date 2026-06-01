// ─────────────────────────────────────────────────────────────
// Example — Lesson 11: the CodeAgent (code as action).
//
// Watch the difference from the ToolCallingAgent: the CodeAgent can
// loop and combine tool calls inside a single block of code, instead of
// one JSON call per turn.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:11
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runCodeAgent } from "../src/code-agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '7 * 7'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runCodeAgent(
  "Compute the sum of the first 10 square numbers (1, 4, 9, ...). " +
    "Use the calculator tool for the arithmetic.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
