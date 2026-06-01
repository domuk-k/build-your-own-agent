// ─────────────────────────────────────────────────────────────
// Example — Lesson 02: the agent loop.
//
// runSimpleAgent() calls the model, reads the reply, and loops until
// the model emits "FINAL ANSWER:". No tools yet — just the loop that
// every later agent is built on.
//
// Run it:  npm run example:02
// ─────────────────────────────────────────────────────────────

import { runSimpleAgent } from "../src/loop.ts";

const answer = await runSimpleAgent(
  "A train travels 90 km in 1.5 hours. What is its average speed in km/h? " +
    "Reason step by step, then give the final answer.",
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
