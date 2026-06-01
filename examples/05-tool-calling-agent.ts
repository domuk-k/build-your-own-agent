// ─────────────────────────────────────────────────────────────
// Example — Lesson 05: the ToolCallingAgent.
//
// The Lesson 02 loop, grown up: the model now calls tools. runAgent()
// loops, dispatches the model's tool calls, feeds results back, and
// returns when the model answers directly.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:05
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '12 * (3 + 4)'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runAgent(
  "What is 12 * (3 + 4), then minus 9? Use the calculator.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
