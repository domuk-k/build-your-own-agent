// ─────────────────────────────────────────────────────────────
// Lesson 11 — CodeAgent
//
// smolagents' signature idea: instead of emitting one JSON tool call at
// a time, the model writes JavaScript. Each turn it sends a code block;
// we run it in the sandbox (Lesson 10), feed the printed output back as
// an observation, and loop until the code calls final_answer().
//
// Why this is powerful: code can loop, branch, combine several tool
// calls, and store intermediate values in one turn — a far richer
// action space than one-tool-per-turn JSON. Notice we reuse the plain
// callLLM from Lesson 01: a CodeAgent needs no special tool-calling API.
// ─────────────────────────────────────────────────────────────

import type { Tool } from "./types.ts";
import { callLLM } from "./llm.ts";
import { startMemory, remember } from "./memory.ts";
import { runCode } from "./sandbox.ts";
import { logStep } from "./monitor.ts";

const MAX_TURNS = 6;

/** Build the system prompt that asks the model to answer in code. */
function buildCodeSystemPrompt(tools: Tool[]): string {
  const toolList = tools.map((t) => `- await ${t.name}(args): ${t.description}`).join("\n");
  return [
    "You solve tasks by writing JavaScript, not by answering in prose.",
    "Each turn, reply with exactly one code block:",
    "```js",
    "// your code here",
    "```",
    "Inside the code you may call these async tool functions:",
    toolList,
    "Call print(...) to inspect values — their output is returned to you next turn.",
    "When you have the answer, call final_answer(value).",
  ].join("\n");
}

/** Pull the JS out of a ```js ... ``` block (or use the whole reply). */
function extractCode(text: string): string {
  const match = text.match(/```(?:js|javascript)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

/** Run a CodeAgent: the model writes code, we run it, until final_answer. */
export async function runCodeAgent(task: string, tools: Tool[]): Promise<string> {
  const memory = startMemory(buildCodeSystemPrompt(tools));
  remember(memory, { role: "user", content: task });

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const reply = await callLLM(memory);
    remember(memory, { role: "assistant", content: reply });

    const code = extractCode(reply);
    logStep("code", code);

    let result;
    try {
      result = await runCode(code, tools);
    } catch (err) {
      // Hand the error back so the model can fix its own code next turn.
      const message = err instanceof Error ? err.message : String(err);
      logStep("error", message);
      remember(memory, { role: "user", content: `Error:\n${message}` });
      continue;
    }

    if (result.finalAnswer !== undefined) {
      logStep("final_answer", result.finalAnswer);
      return result.finalAnswer;
    }

    const observation = result.logs.length ? result.logs.join("\n") : "(no output)";
    logStep("observation", observation);
    remember(memory, { role: "user", content: `Output:\n${observation}` });
  }

  throw new Error(`CodeAgent did not finish within ${MAX_TURNS} turns.`);
}
