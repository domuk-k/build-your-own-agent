# Beyond the Loop — Where an Agent Can Grow (Lesson 08+)

> 보충 자료 (supplementary). 강의 코드에는 없는 "조감도"입니다. 8강까지 만든
> 범용 골격 위에서, 이 코스가 고른 길(code-as-action)과 **고를 수 있었던 다른
> 길들**을 정리합니다. 학습자가 "왜 9강부터 갑자기 코드 생성으로 좁아졌지?"라고
> 물었을 때를 위한 답.

---

## 한국어

### 한 가지 큰 그림

이 코스는 두 부분으로 갈립니다.

| 구간 | 성격 | 내용 |
|------|------|------|
| **01–08강** | **범용 골격** | 루프 · 기억 · 도구 · 종료 · 시스템 프롬프트 · 관찰 |
| **09–11강** | **한 가지 심화** | code-as-action (smolagents 시그니처) |

8강까지 끝내면 이미 **완결된 범용 에이전트**입니다. 거기서 멈춰도 진짜 동작해요
(`runAgent` = ToolCallingAgent). 9강부터는 "범용"에서 한 발 더 나아가는데, 그
방향이 *하나가 아니라 여러 갈래*입니다. 어떤 코스든 이 지점에서 **"무엇을 깊게
팔지" 하나를 골라야** 합니다 — 다 다루면 산만해지고 끝이 안 나니까요.

### 왜 하필 code-as-action 이었나

1. **출처** — 이 코스는 smolagents에서 영감받았고, 그 핵심 주장이 "JSON 대신
   코드"입니다. 영감의 핵심을 재현하는 게 자연스러워요.
2. **교육적 우아함** — 코드 방식은 **1강의 `callLLM`으로 되돌아갑니다.** "도구
   호출 API는 본질이 아니었다, 루프가 전부다"라는 깨달음을 주는 극적인 회귀.
   다른 방향들엔 이런 "되돌아오는 반전"이 없습니다.
3. **레버리지** — 행동공간을 넓히는 건 다른 모든 방향의 토대가 됩니다. 코드로
   행동하면 계획·반성·도구연결이 코드 안에서 자연히 따라와요.

> "스콥을 줄였다"기보다 **"한 축으로 깊게 팠다"**가 정확합니다. 그리고 그 축이
> 마침 다른 축들을 품을 수 있는 토대라는 게 영리한 선택이고요.

### 8강 이후 갈 수 있었던 다른 길들

같은 01–08강 골격 위에서, 코드 생성 대신 이런 방향으로도 발전할 수 있었습니다.
**전부 같은 루프 골격을 재사용**한다는 점이 핵심입니다 — 골격은 안 바뀌어요.

| 대안 방향 | 무엇을 더하나 | 어떤 문제를 푸나 |
|-----------|---------------|------------------|
| **계획 (Planning)** | plan→execute 분리, ReAct vs Plan-and-Execute, Tree-of-Thought | 복잡한 다단계 작업의 길잡이 |
| **메모리 고도화** | 요약(summarization), RAG/벡터 검색, 장기기억 | 대화가 길어져 컨텍스트가 넘칠 때 |
| **멀티 에이전트** | 서브 에이전트, 위임, 오케스트레이션 | 역할 분담, 병렬 처리 |
| **반성 (Reflection)** | 자기 비평 → 재시도 루프 | 답 품질 self-improve |
| **도구 생태계** | 도구 검색(많을 때), MCP, 동적 도구 로딩 | 대규모 도구 관리 |
| **운영 (Ops)** | 재시도, 토큰 예산, 병렬 tool call, 가드레일, 평가(eval) | 프로덕션 신뢰성 |

### 핵심 take-away

01–08강 골격은 **재사용 가능한 런치패드**입니다. 위 표의 어느 방향으로든 이
골격에서 출발할 수 있어요. 코스는 그중 하나(코드)를 *끝까지 가는 worked
example*로 보여준 것이고, 나머지는 학습자가 같은 골격에 끼워볼 수 있습니다.

> 연습 아이디어: `runAgent`(JSON) 또는 `runCodeAgent`(코드) 위에 위 표의 한
> 방향을 직접 얹어보기. 예) "반성" = 답을 내기 전에 모델에게 자기 답을 비평시키는
> 턴을 한 번 추가. 골격(루프)은 그대로, 프롬프트와 분기만 바뀝니다.

---

## English

### The one big picture

The course splits in two:

| Part | Nature | Content |
|------|--------|---------|
| **Lessons 01–08** | **General skeleton** | loop · memory · tools · termination · system prompt · observation |
| **Lessons 09–11** | **One deep dive** | code-as-action (smolagents' signature) |

By Lesson 08 you already have a **complete, general-purpose agent** — stop there
and it still works (`runAgent` = ToolCallingAgent). Lesson 09 onward goes one step
further, but that step branches into *many* directions, not one. Any course must
pick **one thing to go deep on** here; covering them all gets unfocused and never
ends.

### Why code-as-action specifically

1. **Source** — the course is inspired by smolagents, whose core claim is "write
   code, not JSON." Reproducing that core idea is natural.
2. **Pedagogical elegance** — the code path **returns to `callLLM` from Lesson
   01.** It delivers the punchline "the tool-calling API was never the essence —
   the loop is the whole agent." No other direction has this dramatic return.
3. **Leverage** — widening the action space underpins every other direction.
   Once actions are code, planning / reflection / tool-chaining follow naturally
   inside the code.

> It's less "narrowing the scope" and more "going deep on one axis" — an axis that
> happens to be a foundation the other axes can sit on.

### Other paths it could have taken after Lesson 08

On the *same* 01–08 skeleton, instead of code generation, the course could have
grown in any of these directions. The key point: **all of them reuse the same
loop skeleton** — the skeleton never changes.

| Alternative direction | What it adds | What it solves |
|-----------------------|--------------|----------------|
| **Planning** | plan→execute split, ReAct vs Plan-and-Execute, Tree-of-Thought | guiding complex multi-step tasks |
| **Richer memory** | summarization, RAG / vector retrieval, long-term memory | when the conversation overflows context |
| **Multi-agent** | sub-agents, delegation, orchestration | role-splitting, parallelism |
| **Reflection** | self-critique → retry loop | self-improving answer quality |
| **Tool ecosystem** | tool retrieval (at scale), MCP, dynamic tool loading | managing many tools |
| **Ops** | retries, token budgets, parallel tool calls, guardrails, eval | production reliability |

### The take-away

The 01–08 skeleton is a **reusable launchpad**. You can start from it toward any
direction above. The course shows one (code) as a worked example carried all the
way; the rest you can graft onto the same skeleton yourself.

> Exercise: graft one row of the table onto `runAgent` (JSON) or `runCodeAgent`
> (code). E.g. "Reflection" = add one turn that asks the model to critique its own
> answer before finalizing. The skeleton (loop) stays; only the prompt and a branch
> change.
