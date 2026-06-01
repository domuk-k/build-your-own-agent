# Lesson 05 — ToolCallingAgent

## 한국어

### 한 가지 핵심

레슨 02의 `while` 루프에, 레슨 04에서 정의한 도구를 붙입니다. 이제 모델은 매 턴마다 **"도구를 불러달라"**고 요청할 수 있고, 우리는 그 도구를 실행해 결과를 다시 대화에 넣어줍니다. 바로 이것이 에이전트입니다.

### 코드가 추가한 것

- **`src/agent.ts` (신규) — `runAgent(task, tools)`**: 이번 레슨의 주인공. `MAX_TURNS`까지 루프를 돌면서 매 턴 `callLLMWithTools`를 호출합니다. 모델이 도구를 요청하지 않으면(`reply.toolCalls`가 비어 있으면) 그 텍스트를 답으로 반환하고, 요청했으면 이름으로 도구를 찾아 `runTool`로 실행한 뒤 결과를 `role: "tool"` 메시지로 `remember`합니다.
- **`src/llm.ts` — `callLLMWithTools(messages, tools)` 추가**: 기존 `callLLM`은 그대로 두고, POST 부분을 `chatCompletion` 헬퍼로 분리했습니다. 새 함수는 요청에 `tools`(각 도구를 `toOpenAITool`로 변환)와 `tool_choice: "auto"`를 실어 보내고, 응답을 `Message`로 돌려줍니다. 보조 함수 `toOpenAIMessages`는 우리 메시지를 OpenAI 형식으로 변환하고, `parseToolCalls`는 응답에서 도구 호출 요청을 읽어냅니다.
- **`src/types.ts` — `ToolCall` 타입 + `Message` 확장**: `Message`에 `toolCalls?`(모델이 부르려는 도구들)와 `toolCallId?`(도구 결과를 호출과 연결)가 추가됐습니다.

### 왜 중요한가

루프가 곧 에이전트의 전부입니다. "모델을 부른다 → 도구를 실행한다 → 결과를 메모리에 넣는다 → 다시 부른다." 프로덕션 프레임워크가 감추는 건 바로 이 루프이며, 여기서 우리는 50줄도 안 되는 `runAgent`로 그 본질을 직접 봅니다. 지금은 "모델이 말로만 답하면 끝"이라는 단순한 종료 조건을 쓰는데, 레슨 06에서 이를 명시적인 `final_answer` 도구로 바꿉니다.

### 직접 보기

```bash
git checkout lesson-05-tool-calling-agent
git diff lesson-04-defining-a-tool lesson-05-tool-calling-agent
```

### 실행

```bash
npm test   # test/agent.test.ts: 도구 호출 → 결과 주입 → 답변까지 2턴을 검증
```

---

## English

### The one idea

Take the `while` loop from Lesson 02 and bolt on the tools you defined in Lesson 04. Now the model can, each turn, **ask to call a tool** — we run it and feed the result back into the conversation. That loop is the whole agent.

### What the code adds

- **`src/agent.ts` (new) — `runAgent(task, tools)`**: the star of this lesson. It loops up to `MAX_TURNS`, calling `callLLMWithTools` each turn. If the model didn't request any tools (`reply.toolCalls` is empty), it returns that text as the answer; otherwise it looks each tool up by name, runs it with `runTool`, and `remember`s the result as a `role: "tool"` message.
- **`src/llm.ts` — adds `callLLMWithTools(messages, tools)`**: the original `callLLM` stays, but the POST is factored into a `chatCompletion` helper. The new function sends `tools` (each converted via `toOpenAITool`) plus `tool_choice: "auto"`, and returns a `Message`. Helpers `toOpenAIMessages` translate our messages into the OpenAI shape, and `parseToolCalls` reads tool requests back out of the response.
- **`src/types.ts` — `ToolCall` type + `Message` extension**: `Message` gains `toolCalls?` (tools the model wants to call) and `toolCallId?` (linking a tool result back to its call).

### Why it matters

The loop is the whole agent: call the model → run the tool → put the result in memory → call again. That loop is exactly what production frameworks hide, and here you see it in a `runAgent` of under 50 lines. For now the stop condition is naive — "the model spoke instead of calling a tool, so we're done." Lesson 06 replaces that with an explicit `final_answer` tool.

### How to see it

```bash
git checkout lesson-05-tool-calling-agent
git diff lesson-04-defining-a-tool lesson-05-tool-calling-agent
```

### Run it

```bash
npm test   # test/agent.test.ts: verifies call tool → feed result back → answer, in two turns
```
