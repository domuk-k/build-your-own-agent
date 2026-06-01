// ─────────────────────────────────────────────────────────────
// Lesson 05 — ToolCallingAgent
//
// The simple loop from Lesson 02, grown up. Same skeleton — call the
// model, decide whether to stop — but now the model can ask to call
// tools. Each turn we either run the tools it requested and loop
// again, or (if it just talked) return that text as the answer.
//
// Lesson 06 will replace "it just talked = done" with an explicit
// final_answer tool. For now, this is the smallest correct version.
// ─────────────────────────────────────────────────────────────

import type { Tool } from "./types.ts";
import { callLLMWithTools } from "./llm.ts";
import { startMemory, remember } from "./memory.ts";
import { runTool } from "./tools.ts";

const MAX_TURNS = 10;

/** Run an agent that can call the given tools until it has an answer. */
export async function runAgent(task: string, tools: Tool[]): Promise<string> {
  const byName = new Map(tools.map((t) => [t.name, t]));

  const memory = startMemory(
    "You are an agent that solves the task using the available tools. " +
      "Call a tool when you need information; answer in words when you are done.",
  );
  remember(memory, { role: "user", content: task });

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const reply = await callLLMWithTools(memory, tools);
    remember(memory, reply);

    // No tool calls means the model answered directly — we're done.
    if (!reply.toolCalls?.length) return reply.content;

    // Otherwise run each requested tool and feed its result back in.
    for (const call of reply.toolCalls) {
      const tool = byName.get(call.name);
      const result = tool
        ? await runTool(tool, call.arguments)
        : `Error: unknown tool "${call.name}"`;
      remember(memory, { role: "tool", toolCallId: call.id, content: result });
    }
  }

  throw new Error(`Agent did not finish within ${MAX_TURNS} turns.`);
}
