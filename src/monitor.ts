// ─────────────────────────────────────────────────────────────
// Lesson 08 — Monitoring
//
// You can't improve what you can't see. A monitor here is just one
// function that prints what the agent is doing, turn by turn, so you
// can watch it think. No class, no framework — a console.log with a
// colored label. Wire it into the loop and the agent becomes legible.
// ─────────────────────────────────────────────────────────────

const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

/** Print one step of the agent's reasoning: a label and a detail. */
export function logStep(label: string, detail: string): void {
  console.log(`${CYAN}[${label}]${RESET} ${detail}`);
}
