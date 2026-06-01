// ─────────────────────────────────────────────────────────────
// Example — Lesson 04: defining a tool. (No API key needed.)
//
// A Tool is data + a run() function. toOpenAITool() turns it into the
// JSON schema the model sees; runTool() validates args with zod and
// executes it. Both run locally — no network.
//
// Run it:  npm run example:04
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runTool, toOpenAITool } from "../src/tools.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '12 * (3 + 4)'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

// 1) How the model SEES the tool:
console.log("=== TOOL AS OPENAI SCHEMA ===");
console.log(JSON.stringify(toOpenAITool(calculator), null, 2));

// 2) Running it with validated args — no network:
const result = await runTool(calculator, { expression: "12 * (3 + 4)" });
console.log("\n=== TOOL RESULT ===\n" + result);
