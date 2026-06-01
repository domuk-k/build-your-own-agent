// ─────────────────────────────────────────────────────────────
// Lesson 04 — Defining a Tool
//
// A tool is just a named function the model may call, plus a
// description (so the model knows WHEN to use it) and a zod schema
// (so we can validate the arguments it sends). We build tools in
// isolation here; Lesson 05 lets the agent actually call them.
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import type { Tool } from "./types.ts";

/** Describe a tool to the OpenAI API as a JSON-Schema "function". */
export function toOpenAITool(tool: Tool) {
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.schema),
    },
  };
}

/** Validate the model's raw arguments against the schema, then run. */
export async function runTool(tool: Tool, rawArgs: unknown): Promise<string> {
  const args = tool.schema.parse(rawArgs);
  return tool.run(args);
}
