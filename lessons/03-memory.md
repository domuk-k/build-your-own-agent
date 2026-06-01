# Lesson 03 — Memory

## 한국어

### 한 줄 요약
에이전트의 "기억"은 마법이 아니라 **대화 메시지를 담은 평범한 배열**이다. 이번 레슨은 그 배열에 이름과 작은 헬퍼 두 개를 붙일 뿐이다.

### 코드가 추가하는 것
새 파일 `src/memory.ts`가 등장한다. 안에는 딱 세 가지뿐이다.
- `Memory` — 그냥 `Message[]`의 타입 별칭. "지금까지의 대화 전체"가 에이전트의 기억이다.
- `startMemory(systemPrompt)` — 시스템 프롬프트를 첫 메시지로 둔 새 기억을 만든다.
- `remember(memory, message)` — 기억에 메시지 하나를 덧붙인다 (`push`).

그리고 `src/loop.ts`의 `runSimpleAgent`가 이걸 쓰도록 바뀐다. 직접 `messages.push(...)` 하던 코드가 `remember(memory, ...)`로, 직접 만들던 배열이 `startMemory(...)`로 대체된다. `callLLM`에는 이제 `memory`를 그대로 넘긴다. **루프의 동작은 한 글자도 안 바뀐다** — 이름만 정리한 것이다.

### 왜 중요한가
Lesson 02에서 "이 배열이 곧 기억"이라고 말만 했는데, 여기서 그걸 실제 코드로 못 박는다. 핵심 인사이트는 이것이다: **기억은 그냥 데이터다.** 클래스도, 벡터DB도, 숨겨진 상태도 없다. 평범한 리스트 + 평범한 함수. 프로덕션 프레임워크가 화려하게 포장하는 "메모리"의 밑바닥이 바로 이 모양이다. 뒤 레슨에서 도구 호출 결과나 코드 실행 결과를 기억에 쌓을 때도 정확히 같은 `remember`를 쓴다.

### 직접 보기
```bash
git checkout lesson-03-memory
git diff lesson-02-the-loop lesson-03-memory
```
diff를 보면 추가된 로직은 없고, `messages` → `memory`로 이름이 바뀐 것뿐임을 눈으로 확인할 수 있다.

### 실행
```bash
npm test
```
`test/memory.test.ts`가 `startMemory`는 시스템 프롬프트를 맨 앞에 두고, `remember`는 순서대로 메시지를 쌓는다는 것을 검증한다.

---

## English

### The one idea
An agent's "memory" is not magic — it is **a plain array of conversation messages**. This lesson just gives that array a name and two tiny helpers.

### What the code adds
A new file `src/memory.ts` shows up, holding exactly three things:
- `Memory` — a type alias for `Message[]`. "The whole conversation so far" is the agent's memory.
- `startMemory(systemPrompt)` — creates a fresh memory with the system prompt as its first message.
- `remember(memory, message)` — appends one message to the memory (a `push`).

Then `runSimpleAgent` in `src/loop.ts` is rewired to use them. The old `messages.push(...)` calls become `remember(memory, ...)`, and the hand-built array becomes `startMemory(...)`. `callLLM` is now handed `memory` directly. **The loop's behavior does not change at all** — we only named things.

### Why it matters
Lesson 02 claimed "this array IS the memory" in a comment; here we make it real in code. The insight: **memory is just data.** No class, no vector DB, no hidden state — a plain list plus plain functions. This bare shape is the floor under every fancy "memory" feature production frameworks sell. In later lessons, when we stack tool-call results or code-execution output, we use this very same `remember`.

### How to see it
```bash
git checkout lesson-03-memory
git diff lesson-02-the-loop lesson-03-memory
```
The diff adds no new logic — you can see with your own eyes it's just `messages` renamed to `memory`.

### Run it
```bash
npm test
```
`test/memory.test.ts` checks that `startMemory` puts the system prompt first and `remember` appends messages in order.
