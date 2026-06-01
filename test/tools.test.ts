import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { toOpenAITool, runTool } from "../src/tools.ts";
import type { Tool } from "../src/types.ts";

const add: Tool = {
  name: "add",
  description: "Add two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
  run: (args) => String(args.a + args.b),
};

test("runTool validates args and runs the tool", async () => {
  assert.equal(await runTool(add, { a: 2, b: 3 }), "5");
});

test("runTool rejects arguments that fail the schema", async () => {
  await assert.rejects(() => runTool(add, { a: "nope" }));
});

test("toOpenAITool exposes the parameters as JSON Schema", () => {
  const def = toOpenAITool(add);
  assert.equal(def.function.name, "add");
  const params = def.function.parameters as { properties: Record<string, unknown> };
  assert.ok("a" in params.properties && "b" in params.properties);
});
