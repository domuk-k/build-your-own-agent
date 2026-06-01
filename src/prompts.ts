// ─────────────────────────────────────────────────────────────
// Lesson 07 — System Prompt
//
// An agent's behavior is shaped by one string: its system prompt.
// In Lesson 06 that string was hard-coded inside the loop. Here we pull
// it into a builder that also lists the available tools by name, so the
// model knows exactly what it is allowed to do.
// ─────────────────────────────────────────────────────────────

import type { Tool } from "./types.ts";

/** Build the agent's system prompt, listing the tools it can call. */
export function buildSystemPrompt(tools: Tool[]): string {
  const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
  return [
    "You are an agent that solves the task using the available tools.",
    "Call a tool when you need information.",
    "When the task is solved, call the `final_answer` tool with your answer.",
    "",
    "Available tools:",
    toolList,
    "- final_answer: Call this with your final answer once the task is solved.",
  ].join("\n");
}
