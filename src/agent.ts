// ─────────────────────────────────────────────────────────────
// Lesson 05 — ToolCallingAgent   (Lesson 06 adds explicit termination)
//
// The simple loop from Lesson 02, grown up. Same skeleton — call the
// model, decide whether to stop — but now the model calls tools.
//
// Lesson 06: instead of guessing "it stopped calling tools, so it must
// be done", we give the agent a real `final_answer` tool. The loop ends
// only when the model explicitly calls it. Termination is now a tool
// call, not a heuristic.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import type { Tool } from "./types.ts";
import { callLLMWithTools } from "./llm.ts";
import { startMemory, remember } from "./memory.ts";
import { runTool } from "./tools.ts";
import { buildSystemPrompt } from "./prompts.ts";

const MAX_TURNS = 10;

/** The built-in tool that ends the loop and returns the answer. */
const finalAnswer: Tool = {
  name: "final_answer",
  description: "Call this with your final answer once the task is solved.",
  schema: z.object({ answer: z.string() }),
  run: (args) => args.answer,
};

/** Run an agent that can call the given tools until it calls final_answer. */
export async function runAgent(task: string, tools: Tool[]): Promise<string> {
  const allTools = [...tools, finalAnswer];
  const byName = new Map(allTools.map((t) => [t.name, t]));

  const memory = startMemory(buildSystemPrompt(tools));
  remember(memory, { role: "user", content: task });

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const reply = await callLLMWithTools(memory, allTools);
    remember(memory, reply);

    if (!reply.toolCalls?.length) {
      // The model talked instead of acting — steer it back to a tool.
      remember(memory, {
        role: "user",
        content: "Use a tool, or call final_answer to finish.",
      });
      continue;
    }

    for (const call of reply.toolCalls) {
      if (call.name === "final_answer") {
        return String((call.arguments as { answer: string }).answer);
      }
      const tool = byName.get(call.name);
      const result = tool
        ? await runTool(tool, call.arguments)
        : `Error: unknown tool "${call.name}"`;
      remember(memory, { role: "tool", toolCallId: call.id, content: result });
    }
  }

  throw new Error(`Agent did not finish within ${MAX_TURNS} turns.`);
}
