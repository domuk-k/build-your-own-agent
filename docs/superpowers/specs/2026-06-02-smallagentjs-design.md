# smallagentjs — Design Spec

**Date:** 2026-06-02
**Status:** Approved (brainstorming locked)

## One-liner

A free, bilingual course that builds a smolagents-style agent framework **from an empty file**, one building block at a time, with near-zero dependencies (`zod` only), targeting **under 2,000 lines** and culminating in a `CodeAgent` that generates and executes code.

## Goal & Audience

Teach **what an AI agent actually is** by hand-rolling every layer — no agent framework, no AI SDK. The learner ends with a ~1,750-line codebase they wrote themselves, understanding the loop that production frameworks hide.

**Goal A (locked):** essence + smolagents spirit. `CodeAgent` is kept as the signature payoff. Production-framework bridging is out of scope for course content.

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Foundation | raw `fetch` → OpenAI Chat Completions | "An agent is a `while` loop + LLM call" — most honest |
| Scope | Naked call → Loop → Memory → Tools → ToolCallingAgent → CodeAgent | CodeAgent is smolagents' signature |
| Dependencies | `zod` only (tool schemas) | TS-idiomatic schemas; everything else from scratch |
| Format | Single codebase that grows + git branches/tags per lesson | `git checkout lesson-03` shows that stage; `main` = final |
| Language | readme bilingual (KO→EN); code/comments English | Domestic-first, globally legible |
| Style | API naming/ergonomics quietly informed by Mastra/AI SDK | Not referenced in materials; pure goal A |
| Compiler | `tsgo` (native preview) for typecheck; `tsx` to run | tsgo preview = fast `--noEmit`; emit still maturing |
| Runtime | Node 22+ / TypeScript | matches sibling ai-sdk crash course |
| Sandbox | `node:vm` (CodeAgent) | zero extra deps; limits discussed honestly in lesson |
| Location | `/Users/dwkim/dev/smallagentjs` | sibling to ai-sdk-v5-crash-course |

## Curriculum (12 lessons; lesson = one block)

| # | Lesson | Adds | Insight |
|---|---|---|---|
| 01 | The Naked Call | `llm.ts` | LLM is just an HTTP request |
| 02 | The Loop | while loop | agent = loop + LLM |
| 03 | Messages & Memory | `messages.ts`, `memory.ts` | conversation is state |
| 04 | Defining a Tool | `tools.ts` | tool = name + description + schema + fn |
| 05 | ToolCallingAgent | `tool-agent.ts` | parse JSON tool call → execute → feed back |
| 06 | final_answer & termination | stop condition | how an agent knows it's done |
| 07 | System Prompt | `prompts.ts` | inject tool descriptions into the prompt |
| 08 | Monitoring | `monitor.ts` | observability & token counting |
| 09 | Why Code > JSON | concept readme | smolagents' core claim |
| 10 | The Sandbox | `sandbox.ts` | run JS safely with `node:vm`, inject tools |
| 11 | CodeAgent | `code-agent.ts` | generate code → execute → observe loop |
| 12 | A Real Agent | `examples/` | end-to-end (e.g., web-search agent) |

## File Structure & Line Budget (~1,750)

```
smallagentjs/
  src/
    llm.ts          # ~120  fetch-based OpenAI client + types
    messages.ts     # ~100  ChatMessage, roles, content types
    memory.ts       # ~130  conversation/step state tracking
    tools.ts        # ~180  Tool abstraction + tool() helper (zod schema)
    tool-agent.ts   # ~230  ToolCallingAgent (JSON tool-call ReAct loop)
    prompts.ts      # ~140  system prompt templates
    monitor.ts      # ~110  logging + token counting
    sandbox.ts      # ~230  node:vm JS executor + tool injection
    code-agent.ts   # ~240  CodeAgent (code-gen → execute loop)
  examples/         # ~200  search-agent etc.
  lessons/          # bilingual readmes (01..12)
  README.md         # course index + checkout guide
```

## Plan Decomposition

Two implementation plans, each shippable on its own:

- **Plan 1 — Working ToolCallingAgent** (lessons 01–08): a runnable JSON tool-calling agent.
- **Plan 2 — CodeAgent** (lessons 09–12): adds the sandbox and code-execution agent.

## Testing

Each core block gets one small smoke test (Node's built-in `node:test`, no extra deps). LLM calls are stubbed via an injectable client interface so tests are deterministic and offline.

## Non-Goals

- Multi-agent / managed agents (possible future bonus)
- Workflows / deterministic orchestration
- Persistent storage, streaming-to-frontend
- Multiple LLM providers (OpenAI only)
- Referencing Mastra/AI SDK in course materials
