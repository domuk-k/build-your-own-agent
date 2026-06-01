// ─────────────────────────────────────────────────────────────
// Lesson 10 — The Sandbox
//
// A CodeAgent writes JavaScript instead of JSON tool calls. To run that
// code we need a place to execute it where we control what it can touch.
// `node:vm` gives us a separate context: we hand in exactly the tools we
// want as functions, plus `print` and `final_answer`, and nothing else.
//
// HONEST LIMIT: node:vm is NOT a security boundary against hostile code
// (it can still reach some globals and block the event loop). It is
// perfect for learning; for untrusted code in production you'd use a
// real isolate (a separate process, container, or microVM).
// ─────────────────────────────────────────────────────────────

import { createContext, runInContext } from "node:vm";
import type { Tool } from "./types.ts";
import { runTool } from "./tools.ts";

export type SandboxResult = {
  logs: string[];
  finalAnswer?: string;
};

/** Execute model-written JS with the given tools exposed as functions. */
export async function runCode(code: string, tools: Tool[]): Promise<SandboxResult> {
  const logs: string[] = [];
  let finalAnswer: string | undefined;

  // Everything the code is allowed to see lives in this object.
  const sandbox: Record<string, unknown> = {
    print: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    final_answer: (value: unknown) => {
      finalAnswer = String(value);
    },
  };
  for (const tool of tools) {
    sandbox[tool.name] = (args: unknown) => runTool(tool, args);
  }

  // Wrap in an async function so the code can `await` tool calls.
  const context = createContext(sandbox);
  await runInContext(`(async () => {\n${code}\n})()`, context, { timeout: 5000 });

  return { logs, finalAnswer };
}
