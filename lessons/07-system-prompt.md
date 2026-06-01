# Lesson 07 — System Prompt

## 한국어

### 이 레슨의 한 가지 아이디어

에이전트의 행동은 결국 **문자열 하나**, 즉 시스템 프롬프트가 결정한다. 그리고 그 프롬프트는 에이전트가 어떤 도구를 쓸 수 있는지까지 직접 알려줘야 한다.

### 코드가 바뀐 부분

지난 레슨(06)에서는 시스템 프롬프트가 루프 안에 문자열로 박혀 있었다. 이번에는 그것을 `src/prompts.ts`의 `buildSystemPrompt(tools)` 함수로 빼냈다.

- `buildSystemPrompt`는 넘겨받은 `tools` 배열을 `- 이름: 설명` 형태로 나열한 뒤, 마지막에 `final_answer` 도구 설명을 붙여 하나의 프롬프트 문자열을 만든다.
- `src/agent.ts`의 `runAgent`는 이제 하드코딩된 문자열 대신 `startMemory(buildSystemPrompt(tools))`로 메모리를 초기화한다.

즉 변화는 작다. 같은 안내문에 "사용 가능한 도구" 목록이 동적으로 끼워 들어간 것뿐이다.

### 왜 중요한가

모델은 자기가 쓸 수 있는 도구를 **프롬프트로 듣기 전까지는 모른다**. 도구 정의(레슨 04)와 프롬프트를 한 곳에서 엮어주면, 도구를 추가/삭제할 때 안내문이 자동으로 따라온다. 프롬프트는 코드의 일부이지 주석이 아니다 — 에이전트 행동을 바꾸는 가장 강력한 레버다.

### 직접 보기

```bash
git checkout lesson-07-system-prompt
git diff lesson-06-final-answer lesson-07-system-prompt
```

### 실행

```bash
npm test
```

`test/prompts.test.ts`가 `buildSystemPrompt`이 각 도구와 `final_answer`를 프롬프트에 넣는지 확인한다.

---

## English

### The one idea

An agent's behavior comes down to **a single string** — its system prompt. And that prompt is responsible for telling the agent exactly which tools it is allowed to use.

### What the code adds

In the previous lesson (06) the system prompt was a hard-coded string inside the loop. Here we pull it out into `buildSystemPrompt(tools)` in `src/prompts.ts`.

- `buildSystemPrompt` takes the `tools` array, lists each one as `- name: description`, and appends the `final_answer` tool description, returning one prompt string.
- `runAgent` in `src/agent.ts` now seeds memory with `startMemory(buildSystemPrompt(tools))` instead of the inline string.

The change is small on purpose: the same instructions, now with a dynamically generated "Available tools" list spliced in.

### Why it matters

The model has no idea what it can do until the **prompt tells it**. By weaving the tool definitions (Lesson 04) and the prompt together in one place, the instructions follow automatically whenever you add or remove a tool. The prompt is part of the code, not a comment — it is the strongest lever you have over agent behavior.

### See it

```bash
git checkout lesson-07-system-prompt
git diff lesson-06-final-answer lesson-07-system-prompt
```

### Run it

```bash
npm test
```

`test/prompts.test.ts` confirms `buildSystemPrompt` lists each tool and the `final_answer` tool in the prompt.
