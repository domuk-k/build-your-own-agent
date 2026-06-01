# Lesson 10 — The Sandbox

## 한국어

### 한 줄 아이디어
CodeAgent 는 JSON 이 아니라 **JavaScript 를 직접 짜서** 행동한다. 그 코드를 실행할 **통제된 장소**가 필요한데, 이번 레슨에서 `node:vm` 로 그 샌드박스를 만든다.

### 코드가 추가하는 것
새 파일 `src/sandbox.ts` 하나가 핵심이다.

- `runCode(code, tools)` — 모델이 쓴 JS 문자열을 받아 실행하는 async 함수. 반환 타입은 `SandboxResult` ( `logs: string[]` 와 선택적 `finalAnswer?: string` ).
- 코드가 볼 수 있는 모든 것은 `sandbox` 객체 안에만 들어간다. 여기에 `print` (로그를 `logs` 배열에 모음), `final_answer` (답을 잡아둠), 그리고 넘겨받은 각 `tool` 을 `sandbox[tool.name] = (args) => runTool(tool, args)` 로 함수처럼 주입한다.
- `node:vm` 의 `createContext` 로 격리된 컨텍스트를 만들고, 코드를 `(async () => { ... })()` 로 감싸 `runInContext(..., { timeout: 5000 })` 로 돌린다. async 래퍼 덕분에 코드 안에서 도구를 `await` 할 수 있다.

함께 추가된 `test/sandbox.test.ts` 는 `add` 도구를 `await` 하고, `print` 로그를 남기고, `final_answer` 로 답을 내보내는 한 흐름을 검증한다.

### 왜 중요한가
도구를 "함수"로 코드에 그냥 꽂아주면, 모델은 변수에 담고, 반복하고, 조합하는 진짜 프로그래밍의 표현력을 얻는다 — JSON 한 번에 도구 하나씩보다 훨씬 풍부한 행동 공간이다.

**정직한 한계:** `node:vm` 은 악의적 코드에 대한 보안 경계가 **아니다**. 일부 글로벌에 닿을 수 있고 이벤트 루프를 막을 수도 있다. 학습용으로는 완벽하지만, 신뢰할 수 없는 코드를 프로덕션에서 돌린다면 별도 프로세스 / 컨테이너 / microVM 같은 진짜 격리가 필요하다.

### 직접 보기
```
git checkout lesson-10-the-sandbox
git diff lesson-08-monitoring lesson-10-the-sandbox
```
(레슨 09 는 "왜 코드가 JSON 보다 나은가" 개념만 다루는 코드 없는 레슨이라, 바로 전 코드 태그는 `lesson-08-monitoring` 이다.)

### 실행
```
npm test
```

---

## English

### The one idea
A CodeAgent acts by **writing JavaScript**, not JSON. To run that code we need a **place we control**, and this lesson builds that sandbox with `node:vm`.

### What the code adds
The whole lesson is one new file, `src/sandbox.ts`.

- `runCode(code, tools)` — an async function that takes the model-written JS string and runs it. It returns a `SandboxResult` ( `logs: string[]` plus an optional `finalAnswer?: string` ).
- Everything the code can see lives only inside the `sandbox` object: `print` (pushes onto the `logs` array), `final_answer` (captures the answer), and each passed-in `tool` injected as a function via `sandbox[tool.name] = (args) => runTool(tool, args)`.
- It builds an isolated context with `node:vm`'s `createContext`, wraps the code in `(async () => { ... })()`, and runs it through `runInContext(..., { timeout: 5000 })`. The async wrapper is what lets the code `await` tool calls.

The companion `test/sandbox.test.ts` checks one flow: `await` the `add` tool, leave a `print` log, and emit the answer with `final_answer`.

### Why it matters
Hand the model its tools as plain functions inside code and it gains the real expressiveness of programming — storing values, looping, composing — a far richer action space than one JSON tool call at a time.

**Honest limit:** `node:vm` is **not** a security boundary against hostile code. It can still reach some globals and block the event loop. Perfect for learning; for untrusted code in production you'd reach for a real isolate (a separate process, container, or microVM).

### How to see it
```
git checkout lesson-10-the-sandbox
git diff lesson-08-monitoring lesson-10-the-sandbox
```
(Lesson 09 is a code-free concept lesson on "why code beats JSON," so the previous code tag is `lesson-08-monitoring`.)

### Run it
```
npm test
```
