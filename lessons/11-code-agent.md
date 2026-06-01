# Lesson 11 — CodeAgent

## 한국어

### 한 줄 아이디어
smolagents 의 시그니처 기법: 모델이 매 턴 **JavaScript 코드 블록을 쓰면**, 우리가 그것을 샌드박스에서 실행하고, 출력을 다시 관찰값으로 돌려주며, `final_answer()` 가 호출될 때까지 반복한다.

### 코드가 추가하는 것
새 파일 `src/code-agent.ts` 하나가 전부다. 핵심은 `runCodeAgent(task, tools)`.

- `buildCodeSystemPrompt(tools)` — "산문이 아니라 JS 코드 블록 하나로 답하라"고 모델에게 지시하는 시스템 프롬프트를 만든다. 각 도구는 `- await name(args): description` 형태로 나열되고, `print(...)` 로 값을 확인하고 `final_answer(value)` 로 끝내라고 알려준다.
- `extractCode(text)` — 모델 답변에서 ` ```js ... ``` ` 블록 안의 코드만 정규식으로 뽑아낸다 (없으면 전체를 코드로 본다).
- `runCodeAgent(task, tools)` — 진짜 에이전트 루프다. 레슨 03 의 `startMemory` / `remember` 로 대화를 쌓고, `MAX_TURNS`(6) 만큼 반복하며 매 턴:
  1. 레슨 01 의 평범한 `callLLM(memory)` 로 답을 받고,
  2. `extractCode` 로 코드를 꺼내 `logStep`(레슨 08) 으로 찍은 뒤,
  3. 레슨 10 의 `runCode(code, tools)` 로 샌드박스에서 실행한다.
  - 에러가 나면 메시지를 `Error:\n...` 로 메모리에 다시 넣어 모델이 **다음 턴에 스스로 고치게** 한다.
  - `result.finalAnswer` 가 있으면 그 값을 반환하고 끝.
  - 아니면 `result.logs` 를 `Output:\n...` 관찰값으로 메모리에 넣고 다음 턴으로.

함께 추가된 `test/code-agent.test.ts` 는 `fetch` 를 가짜로 막아 모델이 `await add({a:2,b:3})` 후 `final_answer(sum)` 을 호출하는 코드를 내놓게 하고, 결과가 `"5"` 인지 검증한다.

### 왜 중요한가
**루프가 곧 에이전트의 전부다.** LLM 호출 → 코드 실행 → 관찰 → 다시 호출, 이 작은 고리가 반복되는 것 외에 마법은 없다. 그리고 행동을 코드로 표현하니, 한 턴 안에서 반복하고 분기하고 여러 도구를 조합하고 중간값을 저장할 수 있다 — JSON 한 번에 도구 하나씩보다 훨씬 풍부한 행동 공간이다. 또 하나 눈여겨볼 점: 특별한 tool-calling API 가 전혀 필요 없이 레슨 01 의 맨 `callLLM` 을 그대로 재사용한다.

### 직접 보기
```
git checkout lesson-11-code-agent
git diff lesson-10-the-sandbox lesson-11-code-agent
```

### 실행
```
npm test
npm run example:11
```

---

## English

### The one idea
smolagents' signature move: each turn the model **writes a JavaScript code block**, we run it in the sandbox, feed the printed output back as an observation, and loop until the code calls `final_answer()`.

### What the code adds
One new file, `src/code-agent.ts`. The heart is `runCodeAgent(task, tools)`.

- `buildCodeSystemPrompt(tools)` — builds the system prompt that tells the model to answer with a single JS code block, not prose. Each tool is listed as `- await name(args): description`, and it instructs the model to `print(...)` to inspect values and `final_answer(value)` to finish.
- `extractCode(text)` — pulls just the code inside a ` ```js ... ``` ` block out of the reply via regex (falls back to the whole text).
- `runCodeAgent(task, tools)` — the real agent loop. It builds the conversation with `startMemory` / `remember` (Lesson 03) and iterates up to `MAX_TURNS` (6); each turn it:
  1. gets a reply from the plain `callLLM(memory)` from Lesson 01,
  2. extracts the code, logs it with `logStep` (Lesson 08), and
  3. runs it in the sandbox via `runCode(code, tools)` (Lesson 10).
  - On error it puts the message back into memory as `Error:\n...` so the model can **fix its own code next turn**.
  - If `result.finalAnswer` is set, it returns that value and stops.
  - Otherwise it feeds `result.logs` back as an `Output:\n...` observation and loops.

The companion `test/code-agent.test.ts` stubs `fetch` so the model returns code that does `await add({a:2,b:3})` then `final_answer(sum)`, and asserts the result is `"5"`.

### Why it matters
**The loop is the whole agent.** Call the LLM, run the code, observe, call again — there is no magic beyond that small cycle repeating. And because actions are expressed as code, one turn can loop, branch, combine several tools, and store intermediate values — a far richer action space than one JSON tool call at a time. Note too: it needs no special tool-calling API, reusing the bare `callLLM` from Lesson 01.

### How to see it
```
git checkout lesson-11-code-agent
git diff lesson-10-the-sandbox lesson-11-code-agent
```

### Run it
```
npm test
npm run example:11
```
