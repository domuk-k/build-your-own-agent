# Lesson 06 — `final_answer` & Termination

## 한국어

### 한 줄 아이디어
에이전트가 "끝났다"는 걸 추측이 아니라 **명시적인 도구 호출**로 결정하게 만든다. 루프는 모델이 `final_answer` 도구를 부를 때만 멈춘다.

### 무엇이 바뀌었나
지난 레슨(05)의 `runAgent`는 "모델이 도구를 안 부르고 그냥 말하면 = 끝"이라는 휴리스틱으로 종료했다. 이번 레슨은 그 추측을 없앤다.

- `src/agent.ts`에 내장 도구 `finalAnswer`를 추가한다. `name: "final_answer"`, zod 스키마는 `z.object({ answer: z.string() })`, `run`은 받은 `answer`를 그대로 돌려준다.
- `runAgent`는 이제 `allTools = [...tools, finalAnswer]`를 만들어 모델에게 함께 넘긴다(`callLLMWithTools(memory, allTools)`).
- 시스템 프롬프트도 바뀐다 — "끝나면 말로 답하라" 대신 **"끝나면 `final_answer` 도구를 호출하라"**.
- 루프 안에서 도구 호출을 돌릴 때, `call.name === "final_answer"`면 그 `answer`를 `return`하고 루프를 끝낸다. 다른 도구는 평소처럼 `runTool`로 실행하고 결과를 메모리에 다시 넣는다.
- 모델이 도구를 하나도 안 불렀을 때(그냥 떠들 때)는 종료하지 않는다. 대신 `"Use a tool, or call final_answer to finish."`라는 메시지를 메모리에 넣고 `continue`로 다시 시도시킨다.

### 왜 중요한가
종료가 이제 **휴리스틱이 아니라 도구 호출**이다. "모델이 말을 멈췄으니 아마 끝났겠지"라는 애매한 추측은 깨지기 쉽다 — 모델이 중간에 설명을 늘어놓으면 루프가 엉뚱하게 끝난다. `final_answer`를 명시적 신호로 두면, 끝내는 행위 자체가 에이전트가 의도적으로 선택하는 하나의 행동(action)이 된다. 이것이 production 프레임워크가 종료를 다루는 방식이다.

### 직접 보기
```bash
git checkout lesson-06-final-answer
git diff lesson-05-tool-calling-agent lesson-06-final-answer
```
바뀐 파일은 `src/agent.ts`와 `test/agent.test.ts` 둘뿐이다.

### 실행
```bash
npm test
```
테스트는 모델이 1턴에 `add(2,3)`, 2턴에 `final_answer("5")`를 부르고 루프가 정확히 두 턴 만에 `"5"`를 반환하는지 확인한다.

---

## English

### The one idea
Make the agent decide it's "done" through an **explicit tool call**, not a guess. The loop stops only when the model calls the `final_answer` tool.

### What the code change adds
In Lesson 05, `runAgent` terminated with a heuristic: "the model talked instead of calling a tool, so it must be done." This lesson removes that guess.

- Adds a built-in tool `finalAnswer` in `src/agent.ts`: `name: "final_answer"`, a zod schema `z.object({ answer: z.string() })`, and a `run` that returns the `answer` straight back.
- `runAgent` now builds `allTools = [...tools, finalAnswer]` and hands them all to the model (`callLLMWithTools(memory, allTools)`).
- The system prompt changes too — instead of "answer in words when done," it now says **"call the `final_answer` tool with your answer."**
- Inside the loop, when iterating over tool calls, if `call.name === "final_answer"` we `return` its `answer` and end the loop. Any other tool runs as usual via `runTool`, and its result is fed back into memory.
- When the model calls no tools (just talks), we no longer stop. We push `"Use a tool, or call final_answer to finish."` into memory and `continue` to steer it back.

### Why it matters
Termination is now a **tool call, not a heuristic**. "It stopped calling tools, so it's probably finished" is fragile — if the model pauses to explain itself mid-task, the loop ends in the wrong place. Making `final_answer` an explicit signal turns *finishing* into a deliberate action the agent chooses, just like any other tool. This is how production frameworks handle stopping.

### How to see it
```bash
git checkout lesson-06-final-answer
git diff lesson-05-tool-calling-agent lesson-06-final-answer
```
Only two files change: `src/agent.ts` and `test/agent.test.ts`.

### Run it
```bash
npm test
```
The test checks that the model calls `add(2,3)` on turn 1, `final_answer("5")` on turn 2, and the loop returns `"5"` in exactly two turns.
