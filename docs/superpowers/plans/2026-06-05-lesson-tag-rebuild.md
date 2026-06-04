# Lesson 태그 선형 재빌드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. **이 plan 은 단일 stateful `git rebase` 세션을 공유하므로 subagent-per-task 가 아니라 inline 실행(executing-plans, checkpoint 배치)으로 진행한다.** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 각 `lesson-NN` 태그를 self-contained 로 재구성한다 — base URL 픽스가 lesson-01 부터 존재하고, 각 태그에 누적 강의글(`lessons/01..NN-*.md`)과 번호 매긴 실행 example(`examples/NN-*.ts`)이 들어가도록 선형 히스토리를 재작성·재태깅한다.

**Architecture:** `git rebase -i 1e22a59` 로 11개 lesson 커밋을 `edit` 표시하고 각 정지점에서 (1) 해당 강의글을 `418bd83` 에서 checkout, (2) 번호 example 작성/이동, (3) `package.json` 에 `example:NN` script 추가, (4) `commit --amend` 한다. lesson-01 정지점에서 `44b1242` 의 base URL 픽스를 `llm.ts`+`.env.example` 에 fold 한다. 재작성 완료 후 `src/` 트리가 옛 main 과 byte-identical 임을 검증하고 태그를 새 커밋으로 옮긴다.

**Tech Stack:** git (interactive rebase), Node.js ≥22, tsx, `tsgo --noEmit`, `node --test`, zod. Live API 검증은 OpenAI-compatible gateway(`.env` 의 `OPENAI_BASE_URL`).

---

## 배경 사실 (재작성 전 스냅샷 — 실행 시 재확인)

선형 히스토리 (`git log --oneline --reverse`):

```
b0910d0 chore: scaffold smallagentjs              ← rebase 범위 밖
1e22a59 docs: add design spec and implementation plan   ← rebase BASE
3b89773 feat: lesson 01 — the naked LLM call       [tag lesson-01-naked-call]
993844a feat: lesson 02 — the agent loop            [tag lesson-02-the-loop]
f15b465 feat: lesson 03 — name the memory           [tag lesson-03-memory]
ab8f71d feat: lesson 04 — defining a tool           [tag lesson-04-defining-a-tool]
9aaaaa9 feat: lesson 05 — tool-calling agent        [tag lesson-05-tool-calling-agent]
4fb66cf feat: lesson 06 — final_answer              [tag lesson-06-final-answer]
1f1dcca feat: lesson 07 — system prompt             [tag lesson-07-system-prompt]
bb407ff feat: lesson 08 — monitor steps             [tag lesson-08-monitoring]
f1aa860 feat: lesson 10 — node:vm sandbox           [tag lesson-10-the-sandbox]
7bb9676 feat: lesson 11 — the CodeAgent             [tag lesson-11-code-agent]
d930790 feat: lesson 12 — end-to-end examples       [tag lesson-12-a-real-agent]
418bd83 docs: add root README and bilingual lesson writeups   ← lessons/*.md + README
15d629e docs: add MIT LICENSE
44b1242 feat: support any OpenAI-compatible endpoint           ← base URL 픽스 (llm.ts+.env+README)
de1a09c docs: fix line count
935a305 docs: rename course to build-your-own-agent
2dc4d09 docs: add Vercel AI Gateway setup
780fc60 docs: highlight free tiers                  ← origin/main
e4bfd87 docs: agent landscape (범위 밖, main 유지)
60c3c48 docs: self-repair demo (범위 밖, main 유지)
8d0277f docs: lesson tag rebuild design spec
0b9ff18 docs: resolve lesson tag rebuild spec review gate   ← 현 HEAD
```

**진입점 시그니처 (각 lesson 시점에 export 확인됨):**

| lesson | 파일 | export | Live API |
|---|---|---|---|
| 01 | `src/llm.ts` | `callLLM(messages: Message[]): Promise<string>` | 예 |
| 02 | `src/loop.ts` | `runSimpleAgent(task: string): Promise<string>` | 예 |
| 03 | `src/memory.ts` | `startMemory(systemPrompt: string): Memory`, `remember(memory, message): void` (+ `callLLM`) | 예 |
| 04 | `src/tools.ts` | `toOpenAITool(tool)`, `runTool(tool, rawArgs): Promise<string>` | **아니오** |
| 05 | `src/agent.ts` | `runAgent(task, tools: Tool[]): Promise<string>` | 예 |
| 06 | `src/agent.ts` | `runAgent` (final_answer 종료) | 예 |
| 07 | `src/prompts.ts` | `buildSystemPrompt(tools: Tool[]): string` (+ `runAgent`) | 예 |
| 08 | `src/monitor.ts` | `logStep(label, detail): void` (runAgent 가 내부 호출) | 예 |
| 10 | `src/sandbox.ts` | `runCode(code, tools): Promise<SandboxResult>` (`{logs, finalAnswer?}`) | **아니오** |
| 11 | `src/code-agent.ts` | `runCodeAgent(task, tools): Promise<string>` | 예 |
| 12 | end-to-end (`runCodeAgent`) | — | 예 |

**불변식:** 재작성 후 `src/` 최종 트리 == 옛 main(`0b9ff18`) 의 `src/`. base URL 픽스가 *언제* 등장하는지만 lesson-01 로 이동.

**충돌 규칙:** rebase replay 중 `src/llm.ts` 의 URL 영역 충돌 시 **항상 `BASE_URL` 버전 채택**. `.env.example` 충돌 시 lesson-01 에서 fold 한 gateway 버전 채택.

---

## Task 0: 안전장치 — 백업 ref + 원본 SHA 기록

**Files:** (git refs only)

- [ ] **Step 1: 작업 트리 clean 확인**

Run: `git status --porcelain`
Expected: 빈 출력 (WIP 없음). 출력이 있으면 멈추고 사용자에게 보고.

- [ ] **Step 2: 현재 브랜치/HEAD 확인**

Run: `git rev-parse --abbrev-ref HEAD && git rev-parse HEAD`
Expected: `main` / `0b9ff18...` (또는 그 시점의 최신 HEAD SHA — 기록해 둔다).

- [ ] **Step 3: 11개 lesson 태그를 backup/ 네임스페이스로 백업 (로컬만)**

```bash
for t in $(git tag -l 'lesson-*'); do git tag "backup/$t" "$t"; done
git tag -l 'backup/lesson-*' | sort -V
```
Expected: `backup/lesson-01-naked-call` … `backup/lesson-12-a-real-agent` 11줄.

- [ ] **Step 4: 원본 main 도 ref 로 보존**

```bash
git update-ref refs/heads/backup/main-before-rebuild HEAD
git rev-parse backup/main-before-rebuild
```
Expected: Step 2 의 HEAD SHA 와 동일.

- [ ] **Step 5: 백업 검증 — 어떤 명령도 lesson-* 목록을 오염시키지 않았는지 확인**

Run: `git tag -l 'lesson-*' | sort -V | wc -l`
Expected: `11` (backup/ 는 `lesson-*` glob 에 안 잡힘).

> **이 task 에는 commit 이 없다.** 백업 ref 는 로컬에만 두고 origin push 하지 않는다(확정 사항). 사고 시 복구: `git reset --hard backup/main-before-rebuild` + `for t in $(git tag -l 'backup/lesson-*'); do git tag -f "${t#backup/}" "$t"; done`.

---

## Task 1: Interactive rebase 시작 + todo 작성

**Files:** (git rebase todo)

- [ ] **Step 1: rebase 시작**

Run: `GIT_SEQUENCE_EDITOR=cat git rebase -i 1e22a59`

먼저 `GIT_SEQUENCE_EDITOR=cat` 로 todo 를 **출력만** 해서 커밋 순서를 눈으로 확인한다(편집 안 함). Expected: `pick 3b89773 … pick 0b9ff18` 순서로 lesson 01~12 + trailing docs 가 나열됨. 확인 후 ctrl-C 로 빠져나오지 말고 다음 step 으로.

- [ ] **Step 2: todo 를 편집해 lesson 커밋과 fold 대상을 `edit` 로 표시**

Run: `git rebase -i 1e22a59`

에디터에서 다음 커밋들의 `pick` 을 `edit` 로 바꾼다 (11 lesson + 2 fold 지점):

```
edit 3b89773 feat: lesson 01 — the naked LLM call
edit 993844a feat: lesson 02 — the agent loop
edit f15b465 feat: lesson 03 — name the memory
edit ab8f71d feat: lesson 04 — defining a tool
edit 9aaaaa9 feat: lesson 05 — tool-calling agent
edit 4fb66cf feat: lesson 06 — final_answer
edit 1f1dcca feat: lesson 07 — system prompt
edit bb407ff feat: lesson 08 — monitor steps
edit f1aa860 feat: lesson 10 — node:vm sandbox
edit 7bb9676 feat: lesson 11 — the CodeAgent
edit d930790 feat: lesson 12 — end-to-end examples
edit 418bd83 docs: add root README and bilingual lesson writeups
edit 44b1242 feat: support any OpenAI-compatible endpoint
```

나머지(15d629e, de1a09c, 935a305, 2dc4d09, 780fc60, e4bfd87, 60c3c48, 8d0277f, 0b9ff18)는 `pick` 그대로. 저장·종료.

- [ ] **Step 3: 첫 정지점이 lesson-01 인지 확인**

Run: `git log --oneline -1 && git status`
Expected: HEAD 가 `3b89773 feat: lesson 01 …`, rebase "interactive rebase in progress; stopped at 3b89773".

---

## Task 2: lesson-01 정지점 — base URL fold + 강의글 + example:01

**Files:**
- Modify: `src/llm.ts` (OPENAI_URL → BASE_URL fold)
- Modify: `.env.example` (gateway 옵션 fold)
- Create: `lessons/01-naked-call.md` (checkout from 418bd83)
- Create: `examples/01-naked-call.ts`
- Modify: `package.json` (dangling `example` → `example:01`)

- [ ] **Step 1: base URL 픽스를 llm.ts 에 fold**

`src/llm.ts` 에서 아래와 같이 교체:

old:
```ts
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
```
new:
```ts
// Any OpenAI-compatible endpoint works: OpenAI, OpenRouter, Vercel AI
// Gateway, a local server. Override OPENAI_BASE_URL to point elsewhere —
// e.g. https://openrouter.ai/api/v1 with a free model in OPENAI_MODEL.
const BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
```

그리고 fetch 호출:

old:
```ts
  const response = await fetch(OPENAI_URL, {
```
new:
```ts
  const response = await fetch(`${BASE_URL}/chat/completions`, {
```

- [ ] **Step 2: .env.example 를 gateway 버전으로 교체**

`.env.example` 전체를 아래로 교체:

```
# smallagentjs talks to any OpenAI-compatible endpoint.
# Pick ONE of the setups below.

# ── Option A: OpenRouter free models (no cost, good for learning) ──
# Get a key at https://openrouter.ai/keys
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-...
# CodeAgent works on any model. For the ToolCallingAgent, pick a free
# model that supports tool calling, e.g.:
OPENAI_MODEL=meta-llama/llama-3.3-70b-instruct:free

# ── Option B: OpenAI ──
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
```

- [ ] **Step 3: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/01-naked-call.md`

- [ ] **Step 4: example 작성 — `examples/01-naked-call.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 01: the naked LLM call.
//
// An LLM is just one HTTP request. callLLM() POSTs the conversation
// and hands back one string. That is the whole "model" we build on.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:01
// ─────────────────────────────────────────────────────────────

import { callLLM } from "../src/llm.ts";
import type { Message } from "../src/types.ts";

const messages: Message[] = [
  { role: "system", content: "You are a terse assistant. Answer in one sentence." },
  { role: "user", content: "In plain words, what is a large language model?" },
];

const reply = await callLLM(messages);
console.log("\n=== MODEL REPLY ===\n" + reply);
```

- [ ] **Step 5: package.json — dangling `example` 을 `example:01` 로 교체**

`package.json` scripts 블록에서:

old:
```json
    "example": "tsx examples/01-search-agent.ts"
```
new:
```json
    "example:01": "node --env-file-if-exists=.env --import tsx examples/01-naked-call.ts"
```

- [ ] **Step 6: typecheck**

Run: `npm run typecheck`
Expected: 에러 없이 통과 (exit 0).

- [ ] **Step 7: Live API 검증 (대표 태그 01)**

전제: `.env` 에 gateway 키 존재. Run: `npm run example:01`
Expected: `=== MODEL REPLY ===` 아래 한 문장 응답 출력, 비-0 종료 없음. 401/네트워크 에러면 멈추고 `.env` 확인.
> 무료티어 429 회피: 다음 live 검증(05) 전 최소 수 초 간격.

- [ ] **Step 8: amend + rebase 진행**

```bash
git add src/llm.ts .env.example lessons/01-naked-call.md examples/01-naked-call.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `993844a feat: lesson 02` 로 이동 (충돌 없음). 만약 이후 커밋 replay 중 `src/llm.ts` URL 충돌이 뜨면 **BASE_URL 버전 채택** 후 `git add src/llm.ts && git rebase --continue`.

---

## Task 3: lesson-02 정지점 — 강의글 + example:02

**Files:**
- Create: `lessons/02-the-loop.md` (checkout)
- Create: `examples/02-the-loop.ts`
- Modify: `package.json` (+`example:02`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/02-the-loop.md`

- [ ] **Step 2: example 작성 — `examples/02-the-loop.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 02: the agent loop.
//
// runSimpleAgent() calls the model, reads the reply, and loops until
// the model emits "FINAL ANSWER:". No tools yet — just the loop that
// every later agent is built on.
//
// Run it:  npm run example:02
// ─────────────────────────────────────────────────────────────

import { runSimpleAgent } from "../src/loop.ts";

const answer = await runSimpleAgent(
  "A train travels 90 km in 1.5 hours. What is its average speed in km/h? " +
    "Reason step by step, then give the final answer.",
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 3: package.json — `example:02` 추가**

scripts 블록에 `example:01` 다음 줄로 추가:
```json
    "example:02": "node --env-file-if-exists=.env --import tsx examples/02-the-loop.ts",
```

- [ ] **Step 4: typecheck**

Run: `npm run typecheck`
Expected: 통과.

- [ ] **Step 5: amend + continue**

```bash
git add lessons/02-the-loop.md examples/02-the-loop.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `f15b465 feat: lesson 03`.

> lesson-02 는 대표 live 샘플이 아니므로 typecheck 만(확정: 01/05/11 만 live).

---

## Task 4: lesson-03 정지점 — 강의글 + example:03

**Files:**
- Create: `lessons/03-memory.md` (checkout)
- Create: `examples/03-memory.ts`
- Modify: `package.json` (+`example:03`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/03-memory.md`

- [ ] **Step 2: example 작성 — `examples/03-memory.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 03: name the memory.
//
// Memory IS the message list. startMemory() seeds it with a system
// prompt; remember() appends. We build a short conversation, then hand
// the whole memory to callLLM() and watch the model recall it.
//
// Run it:  npm run example:03
// ─────────────────────────────────────────────────────────────

import { startMemory, remember } from "../src/memory.ts";
import { callLLM } from "../src/llm.ts";

const memory = startMemory("You are a helpful assistant with a good memory.");
remember(memory, { role: "user", content: "My name is Dwk and I like trains." });
remember(memory, { role: "assistant", content: "Nice to meet you, Dwk!" });
remember(memory, { role: "user", content: "What is my name, and what do I like?" });

const reply = await callLLM(memory);
console.log("\n=== MODEL RECALLS ===\n" + reply);
```

- [ ] **Step 3: package.json — `example:03` 추가**

```json
    "example:03": "node --env-file-if-exists=.env --import tsx examples/03-memory.ts",
```

- [ ] **Step 4: typecheck**

Run: `npm run typecheck`
Expected: 통과.

- [ ] **Step 5: amend + continue**

```bash
git add lessons/03-memory.md examples/03-memory.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `ab8f71d feat: lesson 04`.

---

## Task 5: lesson-04 정지점 — 강의글 + example:04 (API 불필요, 로컬 실행 검증)

**Files:**
- Create: `lessons/04-defining-a-tool.md` (checkout)
- Create: `examples/04-defining-a-tool.ts`
- Modify: `package.json` (+`example:04`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/04-defining-a-tool.md`

- [ ] **Step 2: example 작성 — `examples/04-defining-a-tool.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 04: defining a tool. (No API key needed.)
//
// A Tool is data + a run() function. toOpenAITool() turns it into the
// JSON schema the model sees; runTool() validates args with zod and
// executes it. Both run locally — no network.
//
// Run it:  npm run example:04
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runTool, toOpenAITool } from "../src/tools.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '12 * (3 + 4)'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

// 1) How the model SEES the tool:
console.log("=== TOOL AS OPENAI SCHEMA ===");
console.log(JSON.stringify(toOpenAITool(calculator), null, 2));

// 2) Running it with validated args — no network:
const result = await runTool(calculator, { expression: "12 * (3 + 4)" });
console.log("\n=== TOOL RESULT ===\n" + result);
```

- [ ] **Step 3: package.json — `example:04` 추가**

```json
    "example:04": "node --env-file-if-exists=.env --import tsx examples/04-defining-a-tool.ts",
```

- [ ] **Step 4: typecheck**

Run: `npm run typecheck`
Expected: 통과.

- [ ] **Step 5: 로컬 실행 검증 (API 불필요)**

Run: `npm run example:04`
Expected: `=== TOOL AS OPENAI SCHEMA ===` 아래 JSON, `=== TOOL RESULT ===` 아래 `60`. 네트워크 호출 없음.

- [ ] **Step 6: amend + continue**

```bash
git add lessons/04-defining-a-tool.md examples/04-defining-a-tool.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `9aaaaa9 feat: lesson 05`.

---

## Task 6: lesson-05 정지점 — 강의글 + 기존 example rename/이동 + example:05 (대표 live)

**Files:**
- Create: `lessons/05-tool-calling-agent.md` (checkout)
- Create: `examples/05-tool-calling-agent.ts` (옛 `examples/tool-agent.ts` 내용)
- Modify: `package.json` (+`example:05`)

> 기존 `examples/tool-agent.ts` 는 옛 lesson-12 에서야 등장한다. 여기서는 **그 내용을 번호 파일명으로 새로 만든다**(이 시점 트리엔 아직 examples/ 가 없음). 옛 파일을 git mv 하는 게 아니라 새 경로로 작성.

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/05-tool-calling-agent.md`

- [ ] **Step 2: example 작성 — `examples/05-tool-calling-agent.ts`** (옛 tool-agent.ts 와 동일 코드, 주석만 갱신)

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 05: the ToolCallingAgent.
//
// The Lesson 02 loop, grown up: the model now calls tools. runAgent()
// loops, dispatches the model's tool calls, feeds results back, and
// returns when the model answers directly.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:05
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '12 * (3 + 4)'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runAgent(
  "What is 12 * (3 + 4), then minus 9? Use the calculator.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 3: package.json — `example:05` 추가**

```json
    "example:05": "node --env-file-if-exists=.env --import tsx examples/05-tool-calling-agent.ts",
```

- [ ] **Step 4: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과 (이 시점에 존재하는 test 파일 기준).

- [ ] **Step 5: Live API 검증 (대표 태그 05)**

Run: `npm run example:05`
Expected: 계산기 tool 을 거쳐 `=== FINAL ANSWER ===` 아래 정답(39). 무한루프 없이 종료(`MAX_TURNS` 가드). 직전 live(01) 와 수 초 간격.

- [ ] **Step 6: amend + continue**

```bash
git add lessons/05-tool-calling-agent.md examples/05-tool-calling-agent.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `4fb66cf feat: lesson 06`.

---

## Task 7: lesson-06 정지점 — 강의글 + example:06

**Files:**
- Create: `lessons/06-final-answer.md` (checkout)
- Create: `examples/06-final-answer.ts`
- Modify: `package.json` (+`example:06`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/06-final-answer.md`

- [ ] **Step 2: example 작성 — `examples/06-final-answer.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 06: explicit termination with final_answer.
//
// Same runAgent(), but now the loop ends only when the model calls the
// built-in final_answer tool — not by guessing "it stopped using
// tools". Termination is a tool call, not a heuristic.
//
// Run it:  npm run example:06
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '7 * 6'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runAgent(
  "What is 7 * 6, then plus 8? Use the calculator, then give the final answer.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 3: package.json — `example:06` 추가**

```json
    "example:06": "node --env-file-if-exists=.env --import tsx examples/06-final-answer.ts",
```

- [ ] **Step 4: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 통과.

- [ ] **Step 5: amend + continue**

```bash
git add lessons/06-final-answer.md examples/06-final-answer.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `1f1dcca feat: lesson 07`.

---

## Task 8: lesson-07 정지점 — 강의글 + example:07

**Files:**
- Create: `lessons/07-system-prompt.md` (checkout)
- Create: `examples/07-system-prompt.ts`
- Modify: `package.json` (+`example:07`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/07-system-prompt.md`

- [ ] **Step 2: example 작성 — `examples/07-system-prompt.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 07: extract the system prompt.
//
// The system prompt is no longer hard-coded inside the loop — it is
// built from the tools by buildSystemPrompt(). We print it so you can
// see exactly what the model is told, then run the agent.
//
// Run it:  npm run example:07
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { buildSystemPrompt } from "../src/prompts.ts";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '15 * 15'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

console.log("=== SYSTEM PROMPT ===\n" + buildSystemPrompt([calculator]));

const answer = await runAgent("What is 15 * 15? Use the calculator.", [calculator]);
console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 3: package.json — `example:07` 추가**

```json
    "example:07": "node --env-file-if-exists=.env --import tsx examples/07-system-prompt.ts",
```

- [ ] **Step 4: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 통과.

- [ ] **Step 5: amend + continue**

```bash
git add lessons/07-system-prompt.md examples/07-system-prompt.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `bb407ff feat: lesson 08`.

---

## Task 9: lesson-08 정지점 — 강의글 + example:08

**Files:**
- Create: `lessons/08-monitoring.md` (checkout)
- Create: `examples/08-monitoring.ts`
- Modify: `package.json` (+`example:08`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/08-monitoring.md`

- [ ] **Step 2: runAgent 가 logStep 을 내부 호출하는지 확인**

Run: `git show HEAD:src/agent.ts | grep -n logStep`
Expected: `logStep(` 호출이 loop 안에 존재(import + 호출). 호출이 있으면 example 은 runAgent 만으로 monitor 출력이 보인다. 호출이 없고 import 만 있으면 example 에서 직접 `logStep` 데모를 추가한다(아래 Step 3 의 대안 주석 참고).

- [ ] **Step 3: example 작성 — `examples/08-monitoring.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 08: monitor the agent's steps.
//
// logStep() is wired into the loop, so each turn (the model's tool
// calls and their results) prints as the agent works. Run it and watch
// the trace appear before the final answer.
//
// Run it:  npm run example:08
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runAgent } from "../src/agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '(12 + 8) * 3'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runAgent(
  "Compute (12 + 8) * 3 step by step with the calculator.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
```

> Step 2 에서 runAgent 가 logStep 을 호출하지 않는다면, 위 example 의 import 에 `import { logStep } from "../src/monitor.ts";` 를 추가하고 호출 전후로 `logStep("task", ...)` 한 줄을 넣어 monitor API 를 직접 보여준다. (현재 코드는 호출함을 확인했으므로 기본은 runAgent 만으로 충분.)

- [ ] **Step 4: package.json — `example:08` 추가**

```json
    "example:08": "node --env-file-if-exists=.env --import tsx examples/08-monitoring.ts",
```

- [ ] **Step 5: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 통과.

- [ ] **Step 6: amend + continue**

```bash
git add lessons/08-monitoring.md examples/08-monitoring.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `f1aa860 feat: lesson 10`.

---

## Task 10: lesson-10 정지점 — 강의글(09+10) + example:10 (API 불필요, 로컬 실행 검증)

**Files:**
- Create: `lessons/09-why-code-over-json.md` (checkout — 무태그 개념강 동반)
- Create: `lessons/10-the-sandbox.md` (checkout)
- Create: `examples/10-the-sandbox.ts`
- Modify: `package.json` (+`example:10`)

- [ ] **Step 1: 강의글 checkout (09 + 10)**

Run: `git checkout 418bd83 -- lessons/09-why-code-over-json.md lessons/10-the-sandbox.md`

- [ ] **Step 2: example 작성 — `examples/10-the-sandbox.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 10: the node:vm sandbox. (No API key needed.)
//
// A CodeAgent writes JS instead of JSON tool calls. runCode() executes
// that JS in a node:vm context where only the tools, print() and
// final_answer() are exposed. Here we hand it code directly — no model.
//
// Run it:  npm run example:10
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runCode } from "../src/sandbox.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const code = `
  let total = 0;
  for (let n = 1; n <= 5; n++) {
    total += Number(await calculator({ expression: n + " * " + n }));
  }
  print("sum of squares 1..5 =", total);
  final_answer(total);
`;

const result = await runCode(code, [calculator]);
console.log("=== LOGS ===");
for (const line of result.logs) console.log(line);
console.log("\n=== FINAL ANSWER ===\n" + result.finalAnswer);
```

- [ ] **Step 3: package.json — `example:10` 추가**

```json
    "example:10": "node --env-file-if-exists=.env --import tsx examples/10-the-sandbox.ts",
```

- [ ] **Step 4: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 통과.

- [ ] **Step 5: 로컬 실행 검증 (API 불필요)**

Run: `npm run example:10`
Expected: `=== LOGS ===` 아래 `sum of squares 1..5 = 55`, `=== FINAL ANSWER ===` 아래 `55`. 네트워크 호출 없음.

- [ ] **Step 6: amend + continue**

```bash
git add lessons/09-why-code-over-json.md lessons/10-the-sandbox.md examples/10-the-sandbox.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `7bb9676 feat: lesson 11`.

---

## Task 11: lesson-11 정지점 — 강의글 + example:11 (대표 live)

**Files:**
- Create: `lessons/11-code-agent.md` (checkout)
- Create: `examples/11-code-agent.ts` (옛 `examples/code-agent.ts` 내용)
- Modify: `package.json` (+`example:11`)

- [ ] **Step 1: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/11-code-agent.md`

- [ ] **Step 2: example 작성 — `examples/11-code-agent.ts`** (옛 code-agent.ts 와 동일 코드, 주석만 갱신)

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 11: the CodeAgent (code as action).
//
// Watch the difference from the ToolCallingAgent: the CodeAgent can
// loop and combine tool calls inside a single block of code, instead of
// one JSON call per turn.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:11
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runCodeAgent } from "../src/code-agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '7 * 7'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runCodeAgent(
  "Compute the sum of the first 10 square numbers (1, 4, 9, ...). " +
    "Use the calculator tool for the arithmetic.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 3: package.json — `example:11` 추가**

```json
    "example:11": "node --env-file-if-exists=.env --import tsx examples/11-code-agent.ts",
```

- [ ] **Step 4: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 통과.

- [ ] **Step 5: Live API 검증 (대표 태그 11)**

Run: `npm run example:11`
Expected: CodeAgent 가 코드 블록에서 루프를 돌려 `=== FINAL ANSWER ===` 아래 `385`. 직전 live(05) 와 수 초 간격.

- [ ] **Step 6: amend + continue**

```bash
git add lessons/11-code-agent.md examples/11-code-agent.ts package.json
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `d930790 feat: lesson 12`.

---

## Task 12: lesson-12 정지점 — 강의글 + example:12 + 옛 examples/ 정리

**Files:**
- Create: `lessons/12-a-real-agent.md` (checkout)
- Create: `examples/12-a-real-agent.ts`
- Modify: `package.json` (+`example:12`, 옛 `example:tool`/`example:code` 제거)
- Delete: `examples/tool-agent.ts`, `examples/code-agent.ts` (옛 d930790 가 추가하던 무번호 파일)

> 이 정지점은 옛 lesson-12(d930790) 의 replay 다. 그 커밋의 diff 가 `examples/tool-agent.ts`, `examples/code-agent.ts`, `package.json`(`example:tool`/`example:code`) 을 새로 추가하므로 충돌 가능. 무번호 example 은 05/11 로 대체됐으니 제거한다.

- [ ] **Step 1: replay 충돌/추가 상태 확인**

Run: `git status`
Expected: 옛 d930790 가 추가한 `examples/tool-agent.ts`, `examples/code-agent.ts` 가 트리에 들어옴(충돌 또는 신규). 충돌이면 일단 `git checkout --theirs examples/tool-agent.ts examples/code-agent.ts` 로 받아둔 뒤 Step 4 에서 삭제.

- [ ] **Step 2: 강의글 checkout**

Run: `git checkout 418bd83 -- lessons/12-a-real-agent.md`

- [ ] **Step 3: example 작성 — `examples/12-a-real-agent.ts`**

```ts
// ─────────────────────────────────────────────────────────────
// Example — Lesson 12: a real agent, end to end.
//
// The whole course in one run: a CodeAgent that plans in code, calls a
// tool in a loop, and returns a final answer — the "real agent" we
// built from the naked LLM call up.
//
// Run it:  cp .env.example .env  (add your key)  &&  npm run example:12
// ─────────────────────────────────────────────────────────────

import { z } from "zod";
import { runCodeAgent } from "../src/code-agent.ts";
import type { Tool } from "../src/types.ts";

const calculator: Tool = {
  name: "calculator",
  description: "Evaluate a basic arithmetic expression, e.g. '7 / 3'.",
  schema: z.object({ expression: z.string() }),
  run: ({ expression }) => String(Function(`return (${expression})`)()),
};

const answer = await runCodeAgent(
  "A shop sells notebooks at 3 for $7. How much for 21 notebooks? " +
    "Then, rounding the per-notebook price to the nearest cent, how much " +
    "for 50 notebooks? Use the calculator for the arithmetic.",
  [calculator],
);

console.log("\n=== FINAL ANSWER ===\n" + answer);
```

- [ ] **Step 4: 옛 무번호 example 제거**

```bash
git rm -f --ignore-unmatch examples/tool-agent.ts examples/code-agent.ts
```
Expected: 두 파일 제거(없으면 무시).

- [ ] **Step 5: package.json — `example:12` 추가 + 옛 script 제거**

scripts 블록에서 `example:tool`/`example:code` 줄이 있으면 제거하고, 다음 줄 추가:
```json
    "example:12": "node --env-file-if-exists=.env --import tsx examples/12-a-real-agent.ts"
```
(scripts 블록 마지막 항목이면 끝에 콤마 없이.) 최종 scripts 는 `typecheck`, `test`, `example:01`…`example:12`(09 제외) 순.

- [ ] **Step 6: typecheck + test**

Run: `npm run typecheck && npm test`
Expected: 통과. 무번호 example 참조가 남아 typecheck 가 깨지면 잔여 참조 제거.

- [ ] **Step 7: amend + continue**

```bash
git add -A
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `418bd83 docs: add root README …`.

---

## Task 13: 418bd83 / 44b1242 정지점 처리 + rebase 완료

**Files:**
- `lessons/*.md` (이미 lesson 커밋에 분산됨 → 여기선 net README.md 만)
- `README.md`, `src/llm.ts`, `.env.example` (44b1242: net README 변경만)

- [ ] **Step 1: 418bd83 정지점 상태 확인**

Run: `git status`
Expected: lessons/*.md 는 이미 동일 내용으로 존재(우리가 같은 소스에서 checkout) → git 이 skip, **net 추가는 `README.md` 뿐**. 충돌이 뜨면 lessons 는 현재 트리 버전 유지(`git checkout --ours lessons/`), README 는 추가.

- [ ] **Step 2: 418bd83 amend + continue**

```bash
git add -A
git commit --amend --no-edit
git rebase --continue
```
Expected: 다음 정지점 `44b1242 feat: support any OpenAI-compatible endpoint` (또는 비어서 자동 스킵 안내).

- [ ] **Step 3: 44b1242 정지점 — base URL 픽스는 이미 fold 됨, README 만 남김**

Run: `git status && git show HEAD:src/llm.ts | grep -n BASE_URL`
Expected: `src/llm.ts`/`.env.example` 변경은 이미 적용돼 skip(충돌 시 BASE_URL 버전 채택), `README.md` 변경만 net. 만약 커밋이 완전히 비면 `git rebase --skip`.

- [ ] **Step 4: 44b1242 amend(README만) + continue**

```bash
git add -A
git commit --amend --no-edit
git rebase --continue
```
Expected: 남은 `pick` 들(15d629e … 0b9ff18) 자동 replay 후 rebase 완료 — "Successfully rebased and updated refs/heads/main."

- [ ] **Step 5: rebase 종료 확인**

Run: `git status && git log --oneline -5`
Expected: rebase in progress 없음, HEAD 가 `0b9ff18` 에 해당하는 새 커밋(메시지 동일, SHA 다름).

---

## Task 14: 핵심 불변식 검증 — src/ 트리 동일성

**Files:** (검증만)

- [ ] **Step 1: 최종 src/ == 옛 main src/ (불변식)**

Run: `git diff backup/main-before-rebuild HEAD -- src/`
Expected: **빈 출력**. 한 줄이라도 나오면 base URL fold 외 src 가 바뀐 것 → 멈추고 원인 조사(`git diff` 내용 보고). self-repair 등 범위 밖 파일도 함께 확인: `git diff backup/main-before-rebuild HEAD -- examples/self-repair-demo.ts` 빈 출력.

- [ ] **Step 2: 새 lesson-12 커밋 후보의 src == 옛 main src**

새 lesson-12 커밋 SHA 확보:
```bash
git log --oneline | grep "lesson 12 — end-to-end" 
```
그 SHA 를 `<L12>` 라 하고:
Run: `git diff <L12> backup/main-before-rebuild -- src/`
Expected: **빈 출력** (lesson-12 시점에 src 가 이미 최종 형태 = main 과 동일).

- [ ] **Step 3: 각 lesson 커밋에 누적 writeup/example 이 들어갔는지 스폿체크**

```bash
git log --oneline | grep "lesson 05" # SHA → <L05>
git ls-tree -r --name-only <L05> -- lessons/ examples/
```
Expected(L05): `lessons/01..05-*.md` (5개) + `examples/01..05-*.ts` (5개). lesson-09 writeup 은 L10 부터 등장.

- [ ] **Step 4: 무번호 example 잔재 없음 확인**

Run: `git ls-tree -r --name-only HEAD -- examples/ | grep -E "tool-agent|code-agent\.ts$"`
Expected: 빈 출력(자기복구 데모 `self-repair-demo.ts` 는 별개로 존재해야 함 → `git ls-tree -r --name-only HEAD -- examples/self-repair-demo.ts` 는 한 줄 출력).

> 이 단계까지 **태그는 아직 옛 커밋**을 가리킨다. 불변식이 깨지면 여기서 멈추고 `git reset --hard backup/main-before-rebuild` 로 복구(태그는 안 건드렸으니 그대로).

---

## Task 15: 재태깅 — lesson-NN 태그를 새 커밋으로 이동

**Files:** (git tags)

- [ ] **Step 1: 새 lesson 커밋 SHA 매핑 추출**

```bash
for n in 01 02 03 04 05 06 07 08 10 11 12; do
  sha=$(git log --reverse --oneline --format='%H %s' | grep -m1 "lesson ${n} —" | cut -d' ' -f1)
  echo "$n -> $sha"
done
```
Expected: 11줄, 각 새 SHA(옛 SHA 와 다름). 09 는 무태그라 제외.

- [ ] **Step 2: 태그를 force 이동 (이름 → 새 커밋)**

Step 1 의 매핑으로 각 태그를 새 SHA 로 옮긴다. 태그 이름과 lesson 번호 매핑:
```bash
declare -A T=(
  [01]=lesson-01-naked-call [02]=lesson-02-the-loop [03]=lesson-03-memory
  [04]=lesson-04-defining-a-tool [05]=lesson-05-tool-calling-agent
  [06]=lesson-06-final-answer [07]=lesson-07-system-prompt
  [08]=lesson-08-monitoring [10]=lesson-10-the-sandbox
  [11]=lesson-11-code-agent [12]=lesson-12-a-real-agent
)
for n in 01 02 03 04 05 06 07 08 10 11 12; do
  sha=$(git log --reverse --format='%H %s' | grep -m1 "lesson ${n} —" | cut -d' ' -f1)
  git tag -f "${T[$n]}" "$sha"
done
git tag -l 'lesson-*' --format='%(refname:short) %(objectname:short) %(subject)' | sort -V
```
Expected: 11 태그가 각 새 lesson 커밋(메시지 일치)을 가리킴.

- [ ] **Step 3: 백업과 비교해 태그가 실제로 옮겨졌는지 확인**

Run: `for n in 01 05 11; do t=${T[$n]}; echo "$t: new=$(git rev-parse --short $t) old=$(git rev-parse --short backup/$t)"; done`
Expected: 각 태그 new ≠ old.

> 재태깅은 로컬만. origin push 는 Task 17 에서 사용자가 직접.

---

## Task 16: 태그별 검증 체크리스트 (대표 live + 나머지 test)

각 태그를 detached checkout 해 검증한다. **검증 후 반드시 `git checkout main` 으로 복귀.**

- [ ] **Step 1: 전 태그 typecheck + test (API 불필요)**

```bash
for t in lesson-01-naked-call lesson-02-the-loop lesson-03-memory \
         lesson-04-defining-a-tool lesson-05-tool-calling-agent \
         lesson-06-final-answer lesson-07-system-prompt lesson-08-monitoring \
         lesson-10-the-sandbox lesson-11-code-agent lesson-12-a-real-agent; do
  git checkout --quiet "$t"
  echo "=== $t ==="
  npm run typecheck && (ls test/*.test.ts >/dev/null 2>&1 && npm test || echo "(no tests at this tag)")
done
git checkout --quiet main
```
Expected: 각 태그에서 typecheck 통과, 존재하는 test 통과. 실패한 태그·명령을 기록해 보고.

- [ ] **Step 2: API 불필요 example 로컬 실행 (04, 10)**

```bash
git checkout --quiet lesson-04-defining-a-tool && npm run example:04
git checkout --quiet lesson-10-the-sandbox     && npm run example:10
git checkout --quiet main
```
Expected: 04 → `=== TOOL RESULT === 60`, 10 → `sum of squares 1..5 = 55` / final `55`. 키 없이 동작.

- [ ] **Step 3: 대표 태그 Live API 검증 (01 / 05 / 11)**

전제: `.env` 에 gateway 키. 429 회피로 각 호출 사이 간격을 둔다.
```bash
git checkout --quiet lesson-01-naked-call        && npm run example:01
git checkout --quiet lesson-05-tool-calling-agent && npm run example:05
git checkout --quiet lesson-11-code-agent         && npm run example:11
git checkout --quiet main
```
Expected: 01 → 한 문장 응답, 05 → `=== FINAL ANSWER === 39`, 11 → `=== FINAL ANSWER === 385`. 셋 다 base URL 수동패치 없이(`.env` 의 `OPENAI_BASE_URL` 만으로) 동작 → 재빌드 목표(어떤 태그든 gateway 키로 401 없이) 충족 확인.

- [ ] **Step 4: 검증 요약 기록**

검증 결과(통과/실패 태그, live 응답 샘플)를 사용자에게 보고. 실패가 있으면 Task 17(push) 로 넘어가지 않는다.

---

## Task 17: 사용자에게 push 명령 번들 전달 (직접 실행하지 말 것)

> **글로벌 규칙: 허락 없이 push/force-push 금지.** 이 task 는 **명령을 출력만** 하고 사용자가 직접 실행한다. 재작성으로 main·태그 SHA 가 모두 바뀌었으므로 force 가 필요하다.

- [ ] **Step 1: 사용자에게 전달할 명령 번들 제시**

아래를 사용자에게 그대로 보여준다(실행 X):

```bash
# 1) main force-push (재작성됨)
git push --force-with-lease origin main

# 2) 재태깅된 11개 lesson 태그 force-push
git push --force origin \
  lesson-01-naked-call lesson-02-the-loop lesson-03-memory \
  lesson-04-defining-a-tool lesson-05-tool-calling-agent \
  lesson-06-final-answer lesson-07-system-prompt lesson-08-monitoring \
  lesson-10-the-sandbox lesson-11-code-agent lesson-12-a-real-agent
```

- [ ] **Step 2: 기존 clone 사용자용 안내 한 줄 (README 고려)**

사용자에게 안내: 이미 clone+fetch 하는 학습자는 태그가 자동 갱신 안 되므로 `git fetch --tags --force` 필요. README 에 "태그 재빌드됨 — 최신 학습은 `git fetch --tags --force`" 한 줄 추가를 사용자가 원하는지 확인(원하면 별도 docs 커밋).

- [ ] **Step 3: 백업 ref 정리 시점 안내**

push 후 며칠 안정화되면 로컬 백업 ref 정리 가능(사용자 판단):
```bash
git tag -l 'backup/lesson-*' | xargs -n1 git tag -d
git branch -D backup/main-before-rebuild
```
이 정리는 push 검증이 끝나기 전엔 하지 않는다.

---

## Self-Review

**Spec coverage (design doc §2~§9 대비):**
- §2 base URL lesson-01 부터 → Task 2 (fold). ✓
- §2 누적 writeup → 각 lesson task Step "강의글 checkout" + Task 14 Step 3 스폿체크. ✓
- §2 번호 example 매 강의 → Task 2~12 (01~08,10~12), 09 무example. ✓
- §2 lesson-09 무태그 → Task 10 에서 writeup 만, 재태깅(Task 15)에서 09 제외. ✓
- §핵심 불변식 src 동일 → Task 14. ✓
- §3 결정 5건 + §9 확정 3건(번호 rename / 대표 live / backup local) → Task 6·11·12(rename), Task 16(검증 깊이), Task 0(backup). ✓
- §6 백업·로컬 한정·push 사용자 → Task 0, Task 17. ✓
- §7 force-push 영향 → Task 17 Step 2. ✓
- §8 범위 밖(self-repair, landscape) 유지 → Task 14 Step 1·4 에서 불변 확인. ✓

**Placeholder scan:** 각 example 은 완전한 코드. 강의글은 `git checkout 418bd83 -- <정확한 파일>` 명령(placeholder 아님). package.json 변경은 정확한 JSON 라인. lesson-08 의 logStep 분기는 Step 2 확인 명령 + 양쪽 구체 지침 제공. 미해결 placeholder 없음.

**Type consistency:** 진입점 시그니처는 §배경 표와 일치 — `callLLM(Message[])`, `runSimpleAgent(string)`, `startMemory(string)`/`remember(memory,message)`, `runTool(tool,rawArgs)`/`toOpenAITool(tool)`, `runAgent(task,Tool[])`, `buildSystemPrompt(Tool[])`, `logStep(label,detail)`, `runCode(code,Tool[])→{logs,finalAnswer?}`, `runCodeAgent(task,Tool[])`. example 코드의 import 경로(`../src/*.ts`)와 `Tool` 타입 사용 일관. ✓

**열린 리스크 (실행 중 주시):**
- rebase replay 시 `src/llm.ts` URL 영역 충돌 가능 → 충돌 규칙(BASE_URL 채택) 명시됨.
- 418bd83/44b1242 가 비어 자동 스킵될 수 있음 → `git rebase --skip` 안내 포함.
- 무료티어 429 → live 호출 간격 명시.