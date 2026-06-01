// ─────────────────────────────────────────────────────────────
// Example — Lesson 07: extract the system prompt.
//
// The system prompt is no longer hard-coded inside the loop — it is
// built from the tools by buildSystemPrompt(). We print it so you can
// see exactly what the model is told, then run the agent.
//
// Run it:  npm run example:07
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { buildSystemPrompt } from "../src/prompts.ts";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '15 * 15'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

console.log("=== SYSTEM PROMPT ===\n" + buildSystemPrompt([calculator]));

const answer = await runAgent("What is 15 * 15? Use the calculator.", [calculator]);
console.log("\n=== FINAL ANSWER ===\n" + answer);
