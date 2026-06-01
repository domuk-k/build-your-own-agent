# Lesson 01 — The Naked Call

## 한국어

### 핵심 한 가지
LLM은 마법도 SDK도 아니다. 그냥 **HTTP 요청 한 번**이다. 대화를 POST로 보내고, 답변 문자열 하나를 돌려받는다. 그게 전부다.

### 무엇이 추가됐나
파일 세 개로 시작한다. 코드를 읽기 전에 먼저 `src/types.ts`를 본다 — 로직은 없고 **데이터의 모양**만 있다.

- `src/types.ts`
  - `Role` — 대화에서 말하는 주체: `"system" | "user" | "assistant" | "tool"`.
  - `Message` — 대화 한 줄. `{ role, content }`. 프레임워크 전체가 이 `Message`들을 주고받는다.
- `src/llm.ts`
  - `callLLM(messages: Message[]): Promise<string>` — 이 프로젝트에서 **유일하게 네트워크와 대화하는 곳**.
  - SDK 없이 `fetch`로 OpenAI Chat Completions에 직접 POST. `OPENAI_API_KEY`가 없으면 에러를, 응답이 실패면 상태코드를 던진다.
  - 모델은 `OPENAI_MODEL` 환경변수, 없으면 `gpt-4o-mini`. 응답에서 `data.choices[0].message.content` 한 줄만 꺼내 반환한다.
- `test/llm.test.ts`
  - `globalThis.fetch`를 가짜로 갈아끼워 **오프라인·결정론적**으로 테스트한다. 네트워크 없이 "보낸 메시지가 맞는지, 받은 텍스트를 그대로 돌려주는지"만 확인.

### 왜 중요한가
에이전트의 신비함을 한 꺼풀 벗기는 단계다. 프로덕션 프레임워크가 감추는 것의 바닥에는 이 함수 하나가 있다 — 대화를 보내고 텍스트를 받는다. 앞으로 모든 레슨은 이 `callLLM` 한 줄을 **루프로, 기억으로, 도구로** 감싸 나가는 과정일 뿐이다. 토대가 단순할수록 그 위에 쌓는 것이 정직해진다.

### 직접 보기
```bash
git checkout lesson-01-naked-call
```
이건 첫 기능 커밋이라 비교할 이전 태그가 없다. 그래서 추가된 전부를 그냥 펼쳐 본다:
```bash
git show lesson-01-naked-call
```

### 실행
```bash
npm test
```
(실제 OpenAI 호출은 stub이라 키 없이도 통과한다.)

---

## English

### The one idea
An LLM is not magic and not an SDK. It is just **one HTTP request**. You POST the conversation and read back a single string of text. That's all.

### What the change adds
We start with three files. Read `src/types.ts` first — it has no logic, only the **shapes** of the data.

- `src/types.ts`
  - `Role` — who is speaking: `"system" | "user" | "assistant" | "tool"`.
  - `Message` — one line of a conversation: `{ role, content }`. The whole framework just moves these `Message`s around.
- `src/llm.ts`
  - `callLLM(messages: Message[]): Promise<string>` — the **only place in the project that talks to the network**.
  - No SDK: a raw `fetch` POST to OpenAI Chat Completions. Throws if `OPENAI_API_KEY` is missing, and throws the status code if the response fails.
  - Model comes from `OPENAI_MODEL`, defaulting to `gpt-4o-mini`. It pulls out just `data.choices[0].message.content` and returns it.
- `test/llm.test.ts`
  - Swaps `globalThis.fetch` for a stub so the test is **offline and deterministic**. No network — it only checks that the sent message is correct and that the returned text comes straight back.

### Why it matters
This is where the mystery comes off. Under everything a production framework hides sits this one function: send a conversation, get text back. Every later lesson is just wrapping this single `callLLM` in **a loop, then memory, then tools**. The simpler the foundation, the more honest everything you build on top of it.

### How to see it
```bash
git checkout lesson-01-naked-call
```
This is the first feature commit, so there is no previous tag to diff against. Instead, just unfold everything it adds:
```bash
git show lesson-01-naked-call
```

### Run it
```bash
npm test
```
(The real OpenAI call is stubbed, so it passes with no API key.)
