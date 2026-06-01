# build-your-own-agent

> Build an AI agent **from an empty file**, one small building block at a time — in under 500 lines of TypeScript, with near-zero dependencies.

A free, bilingual (한국어/English) course. You write every layer yourself: the LLM call, the loop, memory, tools, a tool-calling agent, and finally a **CodeAgent** that writes and runs its own code. No agent framework, no AI SDK — just `fetch` and one tiny library (`zod`) for tool schemas.

Inspired by [smolagents](https://github.com/huggingface/smolagents) — not a reimplementation of it, but the same spirit: the smallest agent that still teaches the real ideas. The package you build is called `smallagentjs`.

---

## 한국어

### 이게 뭔가요?

AI 에이전트가 *실제로 무엇인지*를, 프레임워크 뒤에 숨은 걸 직접 손으로 짜며 배우는 강의입니다. 끝까지 가면 약 270줄짜리 에이전트 코드베이스를 본인이 다 작성하게 됩니다.

**핵심 원칙**
- **밑바닥부터**: OpenAI를 `fetch`로 직접 호출. SDK 없음.
- **클래스 없음**: 전부 함수 + plain data. `this` 인지부하 제거.
- **타입은 분리**: 모든 데이터 모양은 `src/types.ts`에. 나머지 파일은 로직만.
- **git 히스토리 = 커리큘럼**: 각 강의가 작은 누적 커밋 하나 + 태그. `git checkout`으로 그 시점 코드를 보고, `git diff`로 "이번 강의가 추가한 것"만 봅니다.

### 강의가 작동하는 방식

각 강의는 git 태그입니다. 순서대로 읽으세요:

```bash
git checkout lesson-01-naked-call     # 그 강의 시점의 코드
git diff lesson-04-defining-a-tool lesson-05-tool-calling-agent   # 강의 05가 더한 것만
git checkout main                     # 최종 완성본으로 복귀
```

각 강의의 설명은 `lessons/NN-*.md`에 한국어/영어로 있습니다.

### 시작하기

```bash
npm install
npm test              # 12개 테스트, API 키 없이 오프라인 동작
cp .env.example .env  # 키 입력 (.env.example에 무료 OpenRouter 설정 포함)
npm run example:tool  # ToolCallingAgent 실행
npm run example:code  # CodeAgent 실행
```

**무료로 돌리기:** OpenAI 호환 엔드포인트면 무엇이든 됩니다. `.env.example`의 OpenRouter 무료 모델 설정을 쓰면 비용 없이 실행할 수 있어요(키만 발급). CodeAgent는 아무 모델이나, ToolCallingAgent는 tool calling 지원 무료 모델이 필요합니다. 타입체크는 `npm run typecheck` (네이티브 `tsgo`).

---

## English

### What is this?

A course that teaches what an AI agent *actually is* by hand-rolling every layer that frameworks hide. By the end you will have written a ~270-line agent codebase yourself.

**Principles**
- **From scratch**: call OpenAI with `fetch`. No SDK.
- **No classes**: plain functions over plain data — no `this`.
- **Types are separated**: every data shape lives in `src/types.ts`; other files hold only logic.
- **The git history is the curriculum**: each lesson is one small cumulative commit + a tag. `git checkout` a lesson to read its code, `git diff` two lessons to see exactly what changed.

### How the course works

Each lesson is a git tag. Read them in order:

```bash
git checkout lesson-01-naked-call
git diff lesson-04-defining-a-tool lesson-05-tool-calling-agent
git checkout main
```

Each lesson's writeup is in `lessons/NN-*.md` (Korean + English).

### Getting started

```bash
npm install
npm test               # 12 tests, run offline with no API key
cp .env.example .env   # add a key (.env.example includes a free OpenRouter setup)
npm run example:tool   # run the ToolCallingAgent
npm run example:code   # run the CodeAgent
```

**Run it for free:** any OpenAI-compatible endpoint works. Use the OpenRouter free-model setup in `.env.example` to run at no cost (just grab a key). The CodeAgent works on any model; the ToolCallingAgent needs a free model that supports tool calling. Type-check with `npm run typecheck` (native `tsgo`).

---

## Curriculum

| # | Lesson | Adds | The idea |
|---|--------|------|----------|
| 01 | The Naked Call | `src/llm.ts` | an LLM is just an HTTP request |
| 02 | The Loop | `src/loop.ts` | an agent is a loop + an LLM call |
| 03 | Memory | `src/memory.ts` | the conversation array *is* the memory |
| 04 | Defining a Tool | `src/tools.ts` | a tool = name + description + schema + fn |
| 05 | ToolCallingAgent | `src/agent.ts` | grow the loop to call tools |
| 06 | final_answer | (agent) | termination is an explicit tool call |
| 07 | System Prompt | `src/prompts.ts` | one string shapes the behavior |
| 08 | Monitoring | `src/monitor.ts` | watch the agent think |
| 09 | Why Code > JSON | (concept) | code is a richer action space |
| 10 | The Sandbox | `src/sandbox.ts` | run model code safely with `node:vm` |
| 11 | CodeAgent | `src/code-agent.ts` | the model writes & runs code |
| 12 | A Real Agent | `examples/` | both agents, end to end |

## Project layout

```
src/
  types.ts       # all shared data shapes (read this first)
  llm.ts         # the only file that talks to the network
  loop.ts        # the simple loop (Lesson 02)
  memory.ts      # conversation state
  tools.ts       # tool definition + zod schema
  agent.ts       # the ToolCallingAgent
  prompts.ts     # system prompt builder
  monitor.ts     # step logging
  sandbox.ts     # node:vm code execution
  code-agent.ts  # the CodeAgent
examples/        # runnable end-to-end agents
lessons/         # bilingual writeups, one per lesson
```

## License

MIT.
