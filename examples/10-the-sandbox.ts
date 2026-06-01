// ─────────────────────────────────────────────────────────────
// Example — Lesson 10: the node:vm sandbox. (No API key needed.)
//
// A CodeAgent writes JS instead of JSON tool calls. runCode() executes
// that JS in a node:vm context where only the tools, print() and
// final_answer() are exposed. Here we hand it code directly — no model.
//
// Run it:  npm run example:10
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runCode } from "../src/sandbox.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const code = `
  let total = 0;
  for (let n = 1; n <= 5; n++) {
    total += Number(await calculator({ expression: n + " * " + n }));
  }
  print("sum of squares 1..5 =", total);
  final_answer(total);
`;

const result = await runCode(code, [calculator]);
console.log("=== LOGS ===");
for (const line of result.logs) console.log(line);
console.log("\n=== FINAL ANSWER ===\n" + result.finalAnswer);
