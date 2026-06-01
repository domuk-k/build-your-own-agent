# Lesson 08 — Monitoring

## 한국어

### 이번 레슨의 한 가지

에이전트가 매 턴 무엇을 하는지 눈으로 볼 수 있게 만든다. 볼 수 없는 것은 고칠 수 없다 — 관찰 가능성(observability)이 디버깅의 출발점이다.

### 코드가 추가하는 것

- 새 파일 `src/monitor.ts` 에 함수 하나 `logStep(label, detail)` 가 생긴다. 클래스도, 프레임워크도 없다. 컬러 라벨(`[tool]` 같은)을 붙여 `console.log` 한 줄을 찍는 게 전부다.
- `src/agent.ts` 의 `runAgent` 루프 안에 이 함수를 끼워 넣는다. 루프가 한 바퀴 돌 때마다 세 가지를 기록한다:
  - 도구 호출 직전: `logStep("tool", `${call.name}(...)`)`
  - 도구 실행 결과: `logStep("observation", result)`
  - 종료 시: `logStep("final_answer", answer)`

즉 에이전트가 "무엇을 부르려 하는가 → 무엇을 돌려받았는가 → 어떻게 끝났는가"가 한 줄씩 흐른다.

### 왜 중요한가

에이전트는 결국 `while` 루프 안에서 LLM을 부르고 도구를 실행하는 일을 반복할 뿐이다 (레슨 02). 하지만 그 루프는 우리 눈에 보이지 않는다. `logStep` 을 루프에 끼워 넣는 순간, 에이전트의 추론 과정이 "읽을 수 있는" 것이 된다. 프로덕션 프레임워크가 화려한 트레이싱 UI로 감추는 것도 본질은 바로 이 한 줄 — 루프의 각 단계를 기록하는 것이다.

### 어떻게 보나

```bash
git checkout lesson-08-monitoring
git diff lesson-07-system-prompt lesson-08-monitoring
```

diff는 단 세 군데다: `monitor.ts` 신규 파일, `agent.ts` 의 `logStep` 호출 세 줄, 그리고 import 한 줄.

### 실행해보기

```bash
npm test           # logStep이 라벨과 detail을 모두 찍는지 확인
npm run example:08   # 에이전트 루프가 실제로 단계를 출력하는 모습
```

---

## English

### The one idea

Make the agent's every turn visible. You can't improve what you can't see — observability is where debugging begins.

### What the code adds

- A new file `src/monitor.ts` with a single function, `logStep(label, detail)`. No class, no framework. It's one `console.log` with a colored label (like `[tool]`).
- That function gets wired into the `runAgent` loop in `src/agent.ts`. On each pass of the loop it records three things:
  - just before calling a tool: `logStep("tool", `${call.name}(...)`)`
  - the tool's result: `logStep("observation", result)`
  - on termination: `logStep("final_answer", answer)`

So you now see "what it's about to call → what came back → how it finished", one line each.

### Why it matters

An agent is, at bottom, a `while` loop that calls an LLM and runs tools over and over (Lesson 02). But that loop is invisible. The moment you slot `logStep` into it, the agent's reasoning becomes legible. What production frameworks hide behind fancy tracing UIs is, at its core, exactly this one line — recording each step of the loop.

### How to see it

```bash
git checkout lesson-08-monitoring
git diff lesson-07-system-prompt lesson-08-monitoring
```

The diff touches just three spots: the new `monitor.ts`, three `logStep` calls in `agent.ts`, and one import line.

### Run it

```bash
npm test           # confirms logStep prints both the label and the detail
npm run example:08   # watch the agent loop actually print its steps
```
