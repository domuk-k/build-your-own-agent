import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { buildSystemPrompt } from "../src/prompts.ts";
import type { Tool } from "../src/types.ts";

test("buildSystemPrompt lists each tool and the final_answer tool", () => {
  const echo: Tool = {
    name: "echo",
    description: "Echo text",
    schema: z.object({ text: z.string() }),
    run: (args) => args.text,
  };
  const prompt = buildSystemPrompt([echo]);
  assert.match(prompt, /echo: Echo text/);
  assert.match(prompt, /final_answer/);
});
