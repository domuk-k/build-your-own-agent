# Lesson 12 — A Real Agent

## 한국어

### 한 줄 아이디어
지금까지 한 조각씩 만든 부품들이 이제 **하나의 돌아가는 에이전트**로 합쳐진다. 진짜 도구를 주고, 진짜 (여러 단계) 질문을 던지고, 답이 나올 때까지 루프가 돌게 한다.

### 코드가 추가하는 것
새 파일은 실행 예제 하나뿐이다 — `src/` 의 핵심 코드는 그대로다.

- `examples/12-a-real-agent.ts` — 레슨 01–11 의 결과물인 `runCodeAgent(task, tools)` 를 호출한다. `zod` 로 `calculator` 도구(`{ expression: string }`)를 정의하고, 한 번에 안 풀리는 다단계 질문("공책 3권에 $7, 21권은 얼마? 권당 가격을 센트로 반올림하면 50권은?")을 던진다. CodeAgent 는 한 블록의 JS 안에서 도구를 반복·조합해 끝까지 계산한다.
- `package.json` 에 `example:12` 스크립트가 추가됐다. `node --env-file-if-exists=.env --import tsx ...` 로 돌아간다 — `.env` 에 API 키만 넣으면 그대로 실행된다.

두 에이전트를 나란히 비교하고 싶다면 이미 만들어 둔 예제를 쓰면 된다: `npm run example:05` (ToolCallingAgent, 레슨 05) vs `npm run example:11` (CodeAgent, 레슨 11).

### 왜 중요한가
**루프 자체가 에이전트의 전부**다. 프레임워크가 숨기던 것 — LLM 호출 + 메모리 + 도구 파싱 + 샌드박스 + 종료 조건 — 을 직접 손으로 짰고, 이제 진짜 다단계 질문 하나에 그 전체 스택이 처음부터 끝까지 도는 걸 본다. ToolCallingAgent 는 턴마다 JSON 도구 하나, CodeAgent 는 코드라는 더 풍부한 행동 공간 안에서 값을 담고, 돌리고, 합친다.

### 직접 보기
```
git checkout lesson-12-a-real-agent
git diff lesson-11-code-agent lesson-12-a-real-agent
```
달라진 건 `examples/12-a-real-agent.ts` 와 `package.json` 의 스크립트뿐이다.

### 실행
```
npm run example:12    # 다단계 질문을 푸는 CodeAgent, 엔드투엔드
```
(`cp .env.example .env` 후 API 키 입력이 필요하다.)

---

## English

### The one idea
The blocks we built one at a time now snap together into **one agent that actually runs**. Give it a real tool, ask it a real (multi-step) question, and let the loop turn until an answer comes out.

### What the code adds
The only new file is one runnable example — the core code under `src/` is untouched.

- `examples/12-a-real-agent.ts` — calls `runCodeAgent(task, tools)`, the payoff of Lessons 01–11. It defines a `calculator` tool with `zod` (`{ expression: string }`) and asks a multi-step question ("notebooks at 3 for $7 — how much for 21? then, rounding the per-notebook price to the cent, how much for 50?"). The CodeAgent loops and combines tool calls inside a single block of JS to carry it through.
- `package.json` gains an `example:12` script. It runs via `node --env-file-if-exists=.env --import tsx ...` — drop your API key into `.env` and it just runs.

To compare the two agents side by side, use the examples you already built: `npm run example:05` (the ToolCallingAgent, Lesson 05) vs `npm run example:11` (the CodeAgent, Lesson 11).

### Why it matters
**The loop is the whole agent.** Everything a framework hides — the LLM call, memory, tool parsing, the sandbox, the stop condition — we hand-rolled, and now we watch the whole stack run end to end on a single real, multi-step question. The ToolCallingAgent makes one JSON tool call per turn; the CodeAgent stores values, loops, and composes inside code — a far richer action space.

### How to see it
```
git checkout lesson-12-a-real-agent
git diff lesson-11-code-agent lesson-12-a-real-agent
```
The only changes are `examples/12-a-real-agent.ts` and the script in `package.json`.

### Run it
```
npm run example:12    # the CodeAgent solving a multi-step question, end to end
```
(Needs `cp .env.example .env` with your API key first.)
