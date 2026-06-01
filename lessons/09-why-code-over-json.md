# Lesson 09 — Why Code > JSON

## 한국어

### 이 레슨의 한 가지 아이디어
지금까지 에이전트는 한 번에 JSON 툴 콜 하나씩 보냈습니다. smolagents의 핵심 주장은 이것입니다 — 모델이 **JSON 대신 코드를 쓰게** 하면 행동 공간(action space)이 훨씬 풍부해진다. 이번 레슨은 코드를 추가하지 않는 **개념 레슨**으로, 왜 그런지 먼저 이해합니다.

### 지금까지 우리가 만든 것 (JSON 방식)
`src/agent.ts`의 `runAgent(task, tools)`가 우리의 JSON 에이전트입니다. 루프는 이렇게 돕니다:
- `callLLMWithTools(memory, allTools)`로 모델을 부른다.
- 모델은 `reply.toolCalls` 안에 툴 콜을 담아 보낸다 — **한 턴에 보통 하나**.
- 각 콜을 `runTool`로 실행하고, 결과를 `observation`으로 메모리에 다시 넣는다.
- 모델이 `final_answer` 툴을 부를 때까지 반복.

핵심 제약: 한 턴에 행동 하나. "검색하고 → 그 결과를 필터링하고 → 합계를 내라"를 하려면 **세 턴**과 세 번의 모델 호출이 필요합니다.

### 코드 방식이 더 나은 이유 (다음 레슨들에서 만들 것)
다음 두 레슨에서 만들 `src/sandbox.ts`의 `runCode`와 `src/code-agent.ts`의 `runCodeAgent`는 모델이 JavaScript 한 블록을 쓰게 합니다. 그 한 블록 안에서 모델은:
- **반복**(loop)하고, **분기**(if)하고,
- 여러 툴 콜을 **이어 붙이고**,
- 중간값을 변수에 **저장**할 수 있습니다 — 전부 한 턴에.

즉 코드는 JSON보다 **표현력이 큰 행동 공간**입니다. JSON 툴 콜은 "함수 하나 호출"이 전부지만, 코드는 "프로그램 하나"입니다. 같은 작업을 더 적은 모델 호출(= 더 적은 토큰, 더 적은 지연)로 끝낼 수 있습니다.

그리고 중요한 점 하나: `runCodeAgent`는 Lesson 01의 평범한 `callLLM`을 그대로 씁니다. 특별한 tool-calling API가 필요 없습니다 — 모델은 그냥 텍스트(코드)를 쓰고, 우리가 그걸 실행합니다. **루프가 곧 에이전트의 전부**라는 사실이 여기서 다시 드러납니다.

### 확인하는 법
이건 개념 레슨이라 새 코드가 없습니다.
- 개념만 보기: `git checkout (no code; concept lesson)`
- JSON 에이전트 구현을 다시 보려면 이전 단계와 비교: `git diff <prev-tag>` (예: `git diff lesson-08`)

### 실행해 보기
JSON 에이전트가 실제로 도는 걸 보고 싶다면: `npm run example:05`

---

## English

### The one idea
Until now the agent emitted one JSON tool call at a time. smolagents' core claim is this — let the model **write code instead of JSON** and its action space gets dramatically richer. This is a **concept lesson** (no new code); we build the intuition before building the machinery.

### What we have so far (the JSON way)
`runAgent(task, tools)` in `src/agent.ts` is our JSON agent. The loop:
- Calls the model via `callLLMWithTools(memory, allTools)`.
- The model returns tool calls in `reply.toolCalls` — **usually one per turn**.
- Each call runs through `runTool`, and the result goes back into memory as an `observation`.
- Repeat until the model calls the `final_answer` tool.

The key constraint: one action per turn. "Search → filter those results → sum them" takes **three turns** and three model calls.

### Why code is better (what the next lessons build)
In the next two lessons, `runCode` in `src/sandbox.ts` and `runCodeAgent` in `src/code-agent.ts` let the model write one JavaScript block. Inside that single block the model can:
- **loop** and **branch**,
- **chain** several tool calls together,
- **store** intermediate values in variables — all in one turn.

So code is a **more expressive action space** than JSON. A JSON tool call is "call one function"; a code block is "run a program." The same task finishes in fewer model calls (= fewer tokens, less latency).

One more thing worth noticing: `runCodeAgent` reuses the plain `callLLM` from Lesson 01. It needs no special tool-calling API — the model just writes text (code), and we execute it. This is where you see again that **the loop is the whole agent**.

### How to see it
This is a concept lesson, so there's no diff.
- Concept only: `git checkout (no code; concept lesson)`
- To revisit the JSON agent against the previous stage: `git diff <prev-tag>` (e.g. `git diff lesson-08`)

### Run it
Want to watch the JSON agent actually run? `npm run example:05`
