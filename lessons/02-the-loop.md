# Lesson 02 — The Loop

## 한국어

### 한 줄 핵심
에이전트의 정체는 단 하나, **반복문**이다. 모델을 부르고, 답을 보고, 멈출지 한 번 더 돌릴지 정한다. 그게 전부다.

### 무엇이 추가됐나
새 파일 `src/loop.ts` 하나, 그리고 테스트 `test/loop.test.ts`.

핵심은 `runSimpleAgent(task)` 함수다. 동작은 이렇다.
- `messages` 배열을 만든다 — `system` 지시문 한 줄 + `user`의 과제. 이 배열이 곧 대화 전체다.
- `for` 루프(최대 `MAX_TURNS = 5`회)를 돌며 매 턴마다 Lesson 01의 `callLLM(messages)`을 호출한다.
- 모델의 답(`assistant`)을 배열에 다시 `push`한다.
- 답에 `"FINAL ANSWER:"`(상수 `FINAL_MARKER`)가 들어 있으면 그 뒷부분을 잘라 반환하고 끝낸다.
- 아니면 `{ role: "user", content: "Continue." }`를 넣어 한 번 더 돌라고 떠민 뒤 루프를 계속한다.
- 5턴 안에 답이 안 나오면 에러를 던진다.

도구도, SDK도 없다. 오직 루프뿐이다.

### 왜 중요한가
프로덕션 프레임워크가 화려하게 감춰 둔 그 "지능"의 정체가 바로 이 `while`(여기선 `for`) 루프다. **루프 자체가 에이전트다.** Lesson 05에서 이 골격에 "도구 호출" 능력이 붙지만, 뼈대는 절대 바뀌지 않는다.

또 하나. 우리가 계속 `push`하는 `messages` 배열, 저게 곧 에이전트의 **기억**이다. 매 턴 전체 대화를 다시 모델에 넘기기 때문에 모델이 "이전 맥락"을 안다. (Lesson 03에서 여기에 이름을 붙여 준다.)

### 직접 보기
```bash
git checkout lesson-02-the-loop
git diff lesson-01-naked-call lesson-02-the-loop
```
diff를 보면 추가된 게 `src/loop.ts`와 `test/loop.test.ts` 둘뿐임을 알 수 있다 — Lesson 01의 `callLLM`은 손대지 않았다.

### 실행
```bash
npm test
```
테스트는 두 개의 가짜 응답("아직 생각 중" → "FINAL ANSWER: 42")을 주입해, 루프가 최종 답이 나올 때까지 정확히 두 턴을 도는지 확인한다.

---

## English

### The one idea
An agent is one thing: a **loop**. Call the model, look at its reply, decide whether to stop or go around again. That's it.

### What the code adds
One new file, `src/loop.ts`, plus a test in `test/loop.test.ts`.

The heart is the `runSimpleAgent(task)` function:
- It builds a `messages` array — one `system` instruction + the `user`'s task. That array *is* the whole conversation.
- It runs a `for` loop (up to `MAX_TURNS = 5`), and each turn calls Lesson 01's `callLLM(messages)`.
- It `push`es the model's `assistant` reply back onto the array.
- If the reply contains `"FINAL ANSWER:"` (the `FINAL_MARKER` constant), it slices off the rest and returns it — done.
- Otherwise it pushes `{ role: "user", content: "Continue." }` to nudge the model along, and loops again.
- If no answer appears within 5 turns, it throws.

No tools, no SDK. Just the loop.

### Why it matters
That "intelligence" production frameworks dress up and hide? It's this `while` (here, `for`) loop. **The loop is the whole agent.** In Lesson 05 this same skeleton gains the ability to call tools — but the skeleton never changes.

And the `messages` array we keep `push`ing to is the agent's **memory**. Because we re-send the full conversation every turn, the model "remembers" what came before. (We give that array a proper name in Lesson 03.)

### How to see it
```bash
git checkout lesson-02-the-loop
git diff lesson-01-naked-call lesson-02-the-loop
```
The diff shows only two new files, `src/loop.ts` and `test/loop.test.ts` — Lesson 01's `callLLM` is untouched.

### Run it
```bash
npm test
```
The test injects two scripted replies ("still thinking" → "FINAL ANSWER: 42") and checks the loop runs exactly two turns until the final answer appears.
