# Plan 1 — Working ToolCallingAgent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable JSON tool-calling agent from raw `fetch`, covering course lessons 01–08, in idiomatic TypeScript with `zod` as the only runtime dependency.

**Architecture:** A small set of focused modules. `llm.ts` defines an injectable `LLMClient` interface (real impl calls OpenAI via `fetch`; a stub drives offline tests). `messages.ts` holds shared types. `tools.ts` wraps a zod-schema'd function as a `Tool`. `tool-agent.ts` runs the ReAct loop: ask the model with tool definitions, execute returned tool calls, feed results back, terminate when the built-in `final_answer` tool is called. `memory.ts`, `prompts.ts`, `monitor.ts` support state, system-prompt building, and observability.

**Tech Stack:** Node 22+, TypeScript, `tsx` (run), `tsgo --noEmit` (typecheck), `node:test` (tests), `zod@^4` (schemas + `z.toJSONSchema`).

---

## File Structure

- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`
- Create: `src/messages.ts` — shared types (`Role`, `ChatMessage`, `ToolCall`, `TokenUsage`)
- Create: `src/llm.ts` — `LLMClient` interface, `OpenAIClient`, `CompleteOptions`, `LLMResponse`
- Create: `src/tools.ts` — `Tool`, `tool()` helper, `toToolSchema()` (zod → OpenAI function def)
- Create: `src/memory.ts` — `Memory` (message log + step records)
- Create: `src/prompts.ts` — `buildSystemPrompt()`
- Create: `src/monitor.ts` — `Monitor` (step log + token accumulation)
- Create: `src/tool-agent.ts` — `ToolCallingAgent`
- Create: `examples/01-search-agent.ts`
- Tests under `test/*.test.ts`

---

### Task 0: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "smallagentjs",
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "typecheck": "tsgo --noEmit",
    "test": "node --import tsx --test test/*.test.ts",
    "example": "tsx examples/01-search-agent.ts"
  },
  "dependencies": { "zod": "^4.0.0" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@typescript/native-preview": "latest",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "types": ["node"]
  },
  "include": ["src", "examples", "test"]
}
```

- [ ] **Step 3: Write `.gitignore` and `.env.example`**

`.gitignore`:
```
node_modules
.env
```

`.env.example`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

- [ ] **Step 4: Install and verify**

Run: `cd /Users/dwkim/dev/smallagentjs && npm install`
Expected: installs `zod`, `tsx`, `@typescript/native-preview`, `typescript` with no errors.

Run: `npx tsgo --version`
Expected: prints a version string (confirms tsgo is available).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore .env.example
git commit -m "chore: scaffold smallagentjs project"
```

---

### Task 1: Shared message types (lesson 03 groundwork)

**Files:**
- Create: `src/messages.ts`
- Test: `test/messages.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/messages.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { userMessage, toolResultMessage } from "../src/messages.ts";

test("userMessage builds a user-role message", () => {
  assert.deepEqual(userMessage("hi"), { role: "user", content: "hi" });
});

test("toolResultMessage carries the tool call id", () => {
  const m = toolResultMessage("call_1", "42");
  assert.equal(m.role, "tool");
  assert.equal(m.toolCallId, "call_1");
  assert.equal(m.content, "42");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/messages.test.ts`
Expected: FAIL — cannot find module `../src/messages.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/messages.ts
export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: Role;
  content: string;
  /** present on assistant messages that requested tool calls */
  toolCalls?: ToolCall[];
  /** present on tool-role messages, links result to its call */
  toolCallId?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export const systemMessage = (content: string): ChatMessage => ({ role: "system", content });
export const userMessage = (content: string): ChatMessage => ({ role: "user", content });
export const assistantMessage = (content: string, toolCalls?: ToolCall[]): ChatMessage => ({
  role: "assistant",
  content,
  ...(toolCalls ? { toolCalls } : {}),
});
export const toolResultMessage = (toolCallId: string, content: string): ChatMessage => ({
  role: "tool",
  content,
  toolCallId,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/messages.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/messages.ts test/messages.test.ts
git commit -m "feat: add shared message types and builders"
```

---

### Task 2: LLM client interface + OpenAI fetch impl (lessons 01–02)

**Files:**
- Create: `src/llm.ts`
- Test: `test/llm.test.ts`

- [ ] **Step 1: Write the failing test (stub client + request shaping)**

```ts
// test/llm.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toOpenAIMessages } from "../src/llm.ts";
import { assistantMessage, toolResultMessage, userMessage } from "../src/messages.ts";

test("toOpenAIMessages maps tool results to OpenAI tool role", () => {
  const out = toOpenAIMessages([
    userMessage("q"),
    assistantMessage("", [{ id: "c1", name: "add", arguments: { a: 1 } }]),
    toolResultMessage("c1", "result"),
  ]);
  assert.equal(out[0].role, "user");
  assert.equal(out[1].tool_calls[0].id, "c1");
  assert.equal(out[1].tool_calls[0].function.name, "add");
  assert.equal(out[2].role, "tool");
  assert.equal(out[2].tool_call_id, "c1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/llm.test.ts`
Expected: FAIL — cannot find module `../src/llm.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/llm.ts
import type { ChatMessage, ToolCall, TokenUsage } from "./messages.ts";
import { assistantMessage } from "./messages.ts";

/** OpenAI function/tool definition (JSON-schema parameters). */
export interface ToolSchema {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
}

export interface CompleteOptions {
  tools?: ToolSchema[];
}

export interface LLMResponse {
  message: ChatMessage;
  usage: TokenUsage;
}

/** The seam the whole framework depends on. Real impl + test stub share it. */
export interface LLMClient {
  complete(messages: ChatMessage[], opts?: CompleteOptions): Promise<LLMResponse>;
}

interface OpenAIMessage {
  role: string;
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

export function toOpenAIMessages(messages: ChatMessage[]): OpenAIMessage[] {
  return messages.map((m): OpenAIMessage => {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
    }
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: JSON.stringify(t.arguments) },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

function parseToolCalls(raw: OpenAIMessage["tool_calls"]): ToolCall[] | undefined {
  if (!raw?.length) return undefined;
  return raw.map((t) => ({
    id: t.id,
    name: t.function.name,
    arguments: t.function.arguments ? JSON.parse(t.function.arguments) : {},
  }));
}

export interface OpenAIClientConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  fetchImpl?: typeof fetch;
}

export class OpenAIClient implements LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;
  private readonly fetchImpl: typeof fetch;

  constructor(cfg: OpenAIClientConfig) {
    this.apiKey = cfg.apiKey;
    this.model = cfg.model ?? "gpt-4o-mini";
    this.baseURL = cfg.baseURL ?? "https://api.openai.com/v1";
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  async complete(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<LLMResponse> {
    const res = await this.fetchImpl(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: toOpenAIMessages(messages),
        ...(opts.tools?.length ? { tools: opts.tools, tool_choice: "auto" } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      choices: { message: OpenAIMessage }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const choice = data.choices[0].message;
    return {
      message: assistantMessage(choice.content ?? "", parseToolCalls(choice.tool_calls)),
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/llm.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/llm.ts test/llm.test.ts
git commit -m "feat: add LLMClient interface and OpenAI fetch client"
```

---

### Task 3: Tools with zod schemas (lesson 04)

**Files:**
- Create: `src/tools.ts`
- Test: `test/tools.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/tools.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { tool, toToolSchema } from "../src/tools.ts";

const add = tool({
  name: "add",
  description: "Add two numbers",
  schema: z.object({ a: z.number(), b: z.number() }),
  execute: ({ a, b }) => a + b,
});

test("tool() returns the definition and runs", async () => {
  assert.equal(await add.execute({ a: 2, b: 3 }), 5);
});

test("toToolSchema produces an OpenAI function definition", () => {
  const s = toToolSchema(add);
  assert.equal(s.type, "function");
  assert.equal(s.function.name, "add");
  const params = s.function.parameters as { properties: Record<string, unknown> };
  assert.ok("a" in params.properties && "b" in params.properties);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/tools.test.ts`
Expected: FAIL — cannot find module `../src/tools.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/tools.ts
import { z } from "zod";
import type { ToolSchema } from "./llm.ts";

export interface Tool<I = any, O = any> {
  name: string;
  description: string;
  schema: z.ZodType<I>;
  execute: (input: I) => Promise<O> | O;
}

/** Identity helper — gives inference and a single definition site. */
export function tool<I, O>(def: Tool<I, O>): Tool<I, O> {
  return def;
}

/** Convert a Tool's zod schema into an OpenAI function definition. */
export function toToolSchema(t: Tool): ToolSchema {
  return {
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: z.toJSONSchema(t.schema),
    },
  };
}

/** Validate raw args against the tool schema, then run it. */
export async function runTool(t: Tool, rawArgs: unknown): Promise<string> {
  const parsed = t.schema.parse(rawArgs);
  const result = await t.execute(parsed);
  return typeof result === "string" ? result : JSON.stringify(result);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/tools.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tools.ts test/tools.test.ts
git commit -m "feat: add Tool abstraction with zod schemas"
```

---

### Task 4: Memory (lesson 03)

**Files:**
- Create: `src/memory.ts`
- Test: `test/memory.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/memory.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Memory } from "../src/memory.ts";
import { userMessage, assistantMessage } from "../src/messages.ts";

test("Memory accumulates messages in order", () => {
  const m = new Memory("You are helpful.");
  m.add(userMessage("hi"));
  m.add(assistantMessage("hello"));
  const msgs = m.toMessages();
  assert.equal(msgs[0].role, "system");
  assert.equal(msgs[1].content, "hi");
  assert.equal(msgs[2].content, "hello");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/memory.test.ts`
Expected: FAIL — cannot find module `../src/memory.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/memory.ts
import type { ChatMessage } from "./messages.ts";
import { systemMessage } from "./messages.ts";

export class Memory {
  private readonly system: ChatMessage;
  private readonly messages: ChatMessage[] = [];

  constructor(systemPrompt: string) {
    this.system = systemMessage(systemPrompt);
  }

  add(message: ChatMessage): void {
    this.messages.push(message);
  }

  /** Full conversation, system prompt first. */
  toMessages(): ChatMessage[] {
    return [this.system, ...this.messages];
  }

  reset(): void {
    this.messages.length = 0;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/memory.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/memory.ts test/memory.test.ts
git commit -m "feat: add Memory for conversation state"
```

---

### Task 5: System prompt + final_answer tool (lessons 06–07)

**Files:**
- Create: `src/prompts.ts`
- Test: `test/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/prompts.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { buildSystemPrompt, finalAnswerTool } from "../src/prompts.ts";
import { tool } from "../src/tools.ts";

test("finalAnswerTool returns its answer", async () => {
  assert.equal(await finalAnswerTool.execute({ answer: "done" }), "done");
});

test("buildSystemPrompt lists tool names", () => {
  const echo = tool({
    name: "echo",
    description: "Echo text",
    schema: z.object({ text: z.string() }),
    execute: ({ text }) => text,
  });
  const prompt = buildSystemPrompt([echo]);
  assert.match(prompt, /echo/);
  assert.match(prompt, /final_answer/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/prompts.test.ts`
Expected: FAIL — cannot find module `../src/prompts.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/prompts.ts
import { z } from "zod";
import { tool, type Tool } from "./tools.ts";

/** Calling this tool terminates the agent loop with `answer`. */
export const finalAnswerTool = tool({
  name: "final_answer",
  description: "Provide the final answer to the user's task and stop.",
  schema: z.object({ answer: z.string() }),
  execute: ({ answer }) => answer,
});

export function buildSystemPrompt(tools: Tool[]): string {
  const toolLines = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
  return [
    "You are an autonomous agent that solves the user's task using tools.",
    "Think step by step. Call exactly one tool per turn.",
    "When you have the final result, call the `final_answer` tool.",
    "",
    "Available tools:",
    toolLines,
    `- final_answer: ${finalAnswerTool.description}`,
  ].join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/prompts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/prompts.ts test/prompts.test.ts
git commit -m "feat: add system prompt builder and final_answer tool"
```

---

### Task 6: Monitor (lesson 08)

**Files:**
- Create: `src/monitor.ts`
- Test: `test/monitor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/monitor.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Monitor } from "../src/monitor.ts";

test("Monitor accumulates token usage", () => {
  const m = new Monitor({ silent: true });
  m.recordUsage({ inputTokens: 10, outputTokens: 5 });
  m.recordUsage({ inputTokens: 3, outputTokens: 2 });
  assert.deepEqual(m.totals(), { inputTokens: 13, outputTokens: 7 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/monitor.test.ts`
Expected: FAIL — cannot find module `../src/monitor.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/monitor.ts
import type { TokenUsage } from "./messages.ts";

export interface MonitorOptions {
  silent?: boolean;
}

export class Monitor {
  private input = 0;
  private output = 0;
  private readonly silent: boolean;

  constructor(opts: MonitorOptions = {}) {
    this.silent = opts.silent ?? false;
  }

  recordUsage(usage: TokenUsage): void {
    this.input += usage.inputTokens;
    this.output += usage.outputTokens;
  }

  step(label: string, detail: string): void {
    if (!this.silent) console.log(`\x1b[36m[${label}]\x1b[0m ${detail}`);
  }

  totals(): TokenUsage {
    return { inputTokens: this.input, outputTokens: this.output };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/monitor.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/monitor.ts test/monitor.test.ts
git commit -m "feat: add Monitor for token accounting and step logging"
```

---

### Task 7: ToolCallingAgent — the loop (lesson 05, the heart)

**Files:**
- Create: `src/tool-agent.ts`
- Test: `test/tool-agent.test.ts`

- [ ] **Step 1: Write the failing test (with a scripted stub LLM)**

```ts
// test/tool-agent.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { ToolCallingAgent } from "../src/tool-agent.ts";
import { tool } from "../src/tools.ts";
import type { LLMClient, LLMResponse } from "../src/llm.ts";
import { assistantMessage } from "../src/messages.ts";

/** Returns scripted responses in order, ignoring input. */
class ScriptedLLM implements LLMClient {
  private i = 0;
  constructor(private readonly script: LLMResponse[]) {}
  async complete(): Promise<LLMResponse> {
    return this.script[this.i++];
  }
}

const usage = { inputTokens: 0, outputTokens: 0 };

test("agent runs a tool then returns final_answer", async () => {
  const add = tool({
    name: "add",
    description: "Add",
    schema: z.object({ a: z.number(), b: z.number() }),
    execute: ({ a, b }) => a + b,
  });

  const llm = new ScriptedLLM([
    { message: assistantMessage("", [{ id: "c1", name: "add", arguments: { a: 2, b: 3 } }]), usage },
    { message: assistantMessage("", [{ id: "c2", name: "final_answer", arguments: { answer: "5" } }]), usage },
  ]);

  const agent = new ToolCallingAgent({ llm, tools: [add], monitor: { silent: true } });
  const result = await agent.run("what is 2+3?");
  assert.equal(result, "5");
});

test("agent throws when it exceeds maxSteps without final_answer", async () => {
  const loopForever: LLMResponse = {
    message: assistantMessage("", [{ id: "x", name: "noop", arguments: {} }]),
    usage,
  };
  const noop = tool({ name: "noop", description: "no-op", schema: z.object({}), execute: () => "ok" });
  const llm = new ScriptedLLM([loopForever, loopForever, loopForever]);
  const agent = new ToolCallingAgent({ llm, tools: [noop], maxSteps: 2, monitor: { silent: true } });
  await assert.rejects(() => agent.run("loop"), /max steps/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/tool-agent.test.ts`
Expected: FAIL — cannot find module `../src/tool-agent.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/tool-agent.ts
import type { LLMClient } from "./llm.ts";
import { Memory } from "./memory.ts";
import { Monitor, type MonitorOptions } from "./monitor.ts";
import { buildSystemPrompt, finalAnswerTool } from "./prompts.ts";
import { runTool, toToolSchema, type Tool } from "./tools.ts";
import { assistantMessage, toolResultMessage, userMessage } from "./messages.ts";

export interface ToolCallingAgentOptions {
  llm: LLMClient;
  tools: Tool[];
  maxSteps?: number;
  monitor?: Monitor | MonitorOptions;
}

export class ToolCallingAgent {
  private readonly llm: LLMClient;
  private readonly tools: Map<string, Tool>;
  private readonly toolSchemas;
  private readonly maxSteps: number;
  private readonly monitor: Monitor;

  constructor(opts: ToolCallingAgentOptions) {
    this.llm = opts.llm;
    const allTools = [...opts.tools, finalAnswerTool];
    this.tools = new Map(allTools.map((t) => [t.name, t]));
    this.toolSchemas = allTools.map(toToolSchema);
    this.maxSteps = opts.maxSteps ?? 10;
    this.monitor =
      opts.monitor instanceof Monitor ? opts.monitor : new Monitor(opts.monitor ?? {});
  }

  async run(task: string): Promise<string> {
    const memory = new Memory(buildSystemPrompt([...this.tools.values()].filter((t) => t.name !== "final_answer")));
    memory.add(userMessage(task));

    for (let step = 1; step <= this.maxSteps; step++) {
      const { message, usage } = await this.llm.complete(memory.toMessages(), {
        tools: this.toolSchemas,
      });
      this.monitor.recordUsage(usage);
      memory.add(message);

      const calls = message.toolCalls ?? [];
      if (calls.length === 0) {
        // Model answered in plain text — treat as the final answer.
        this.monitor.step("answer", message.content);
        return message.content;
      }

      for (const call of calls) {
        this.monitor.step("tool", `${call.name}(${JSON.stringify(call.arguments)})`);
        if (call.name === "final_answer") {
          return String((call.arguments as { answer: string }).answer);
        }
        const tool = this.tools.get(call.name);
        const output = tool
          ? await runTool(tool, call.arguments)
          : `Error: unknown tool "${call.name}"`;
        this.monitor.step("observation", output);
        memory.add(toolResultMessage(call.id, output));
      }
    }
    throw new Error(`Agent exceeded max steps (${this.maxSteps}) without a final answer.`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/tool-agent.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck the whole project**

Run: `npm run typecheck`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/tool-agent.ts test/tool-agent.test.ts
git commit -m "feat: add ToolCallingAgent ReAct loop"
```

---

### Task 8: Runnable example (lesson 05/12 preview)

**Files:**
- Create: `examples/01-search-agent.ts`

- [ ] **Step 1: Write the example**

```ts
// examples/01-search-agent.ts
import { z } from "zod";
import { OpenAIClient } from "../src/llm.ts";
import { ToolCallingAgent } from "../src/tool-agent.ts";
import { tool } from "../src/tools.ts";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Set OPENAI_API_KEY (see .env.example)");

// A toy "search" tool — replace with a real API to go further.
const fakeSearch = tool({
  name: "web_search",
  description: "Search the web and return a short snippet for a query.",
  schema: z.object({ query: z.string() }),
  execute: ({ query }) =>
    `Top result for "${query}": smolagents is a minimal agent library by Hugging Face.`,
});

const agent = new ToolCallingAgent({
  llm: new OpenAIClient({ apiKey, model: process.env.OPENAI_MODEL }),
  tools: [fakeSearch],
});

const answer = await agent.run("What is smolagents? Search first, then answer in one sentence.");
console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 2: Run it (requires a real key)**

Run: `npm run example`
Expected: prints tool/observation logs, then a one-sentence final answer. (Skip if no API key; the unit tests already prove the loop offline.)

- [ ] **Step 3: Commit**

```bash
git add examples/01-search-agent.ts
git commit -m "feat: add runnable search-agent example"
```

- [ ] **Step 4: Tag the milestone**

```bash
git tag lesson-08-toolcalling-agent
```

---

## Self-Review

**Spec coverage (lessons 01–08):**
- 01 Naked Call → `OpenAIClient.complete` (Task 2) ✓
- 02 The Loop → `ToolCallingAgent.run` for-loop (Task 7) ✓
- 03 Messages & Memory → `messages.ts` (Task 1), `memory.ts` (Task 4) ✓
- 04 Defining a Tool → `tools.ts` (Task 3) ✓
- 05 ToolCallingAgent → Task 7 ✓
- 06 final_answer & termination → `finalAnswerTool` + loop return/throw (Tasks 5, 7) ✓
- 07 System Prompt → `buildSystemPrompt` (Task 5) ✓
- 08 Monitoring → `monitor.ts` (Task 6) ✓

**Type consistency:** `LLMClient.complete(messages, opts)` signature is identical in `llm.ts`, the stub in Task 7, and all call sites. `Tool`/`tool()`/`toToolSchema`/`runTool` names match across Tasks 3, 5, 7. `ChatMessage`/`ToolCall`/`TokenUsage` defined once in Task 1, imported everywhere. `Monitor` accepts either an instance or options in Task 7 — consistent with its constructor in Task 6.

**Placeholder scan:** No TBD/TODO; every code step is complete and runnable.

**Open risk to verify at execution time:** `z.toJSONSchema` (Zod 4 API) and `@typescript/native-preview`'s `tsgo` binary name — confirm both during Task 0 install; if `z.toJSONSchema` is unavailable in the installed Zod, fall back to a hand-written zod→JSON-schema mapper limited to the primitives used (object/string/number/boolean).

---

## Lesson Readmes (bilingual)

Lesson readmes are authored during execution as each block lands (one `lessons/NN-*.md` per task, KO→EN). They are documentation, not code, and are committed alongside the task that introduces their block.
