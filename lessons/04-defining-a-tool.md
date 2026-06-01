# Lesson 04 — Defining a Tool

## 한국어

### 한 줄 요지
도구(tool)는 거창한 게 아니다. **이름 + 설명 + 인자 스키마 + 실제 함수**, 이 네 가지를 묶은 것뿐이다.

### 이 레슨이 추가하는 것
- `src/types.ts`에 `Tool` 타입이 생겼다. 필드는 딱 넷이다:
  - `name` — 모델이 부를 이름
  - `description` — 모델이 **언제** 이 도구를 써야 하는지 알려주는 문장
  - `schema` — 모델이 보낸 인자를 검증하는 zod 스키마 (`ZodType`)
  - `run` — 실제 일을 하고 텍스트를 돌려주는 함수
- `src/tools.ts`에 함수 둘:
  - `toOpenAITool(tool)` — 도구를 OpenAI API가 이해하는 JSON-Schema `function` 형태로 변환한다. zod 스키마는 `z.toJSONSchema(tool.schema)`로 변환된다.
  - `runTool(tool, rawArgs)` — 모델이 보낸 **검증되지 않은** 인자를 `tool.schema.parse(rawArgs)`로 먼저 검증하고, 통과하면 `tool.run(args)`를 실행한다.
- `test/tools.test.ts` — `add` 도구로 (1) 인자 검증 후 실행, (2) 잘못된 인자 거부, (3) JSON Schema 노출을 확인한다.

### 왜 중요한가
모델은 우리 함수를 직접 못 부른다. 모델이 아는 건 "이런 이름과 설명을 가진 함수가 있고, 인자는 이런 모양"이라는 **설명**뿐이다. 그래서 도구를 정의한다는 건 두 방향의 번역기를 만드는 일이다:
- **나갈 때** (`toOpenAITool`): 우리 zod 스키마 → 모델이 읽을 JSON Schema
- **들어올 때** (`runTool`): 모델이 보낸 날(raw) 인자 → 검증 후 실제 함수 호출

핵심 통찰: 모델 출력은 절대 믿지 말고 **항상 스키마로 검증**한다. `runTool`이 `parse`를 먼저 부르는 이유가 그거다. 그리고 이번 레슨에서는 도구를 **혼자** 만들기만 한다 — 에이전트가 실제로 이걸 호출하는 건 Lesson 05다.

### 직접 보기
```sh
git checkout lesson-04-defining-a-tool
git diff lesson-03-memory lesson-04-defining-a-tool   # 이번에 바뀐 것만
```

### 실행
```sh
npm test
```

---

## English

### The one idea
A tool isn't fancy. It's just four things bundled together: **a name + a description + an argument schema + the actual function**.

### What this lesson adds
- A `Tool` type in `src/types.ts` with exactly four fields:
  - `name` — what the model calls it
  - `description` — the sentence that tells the model **when** to use it
  - `schema` — a zod schema (`ZodType`) that validates the arguments the model sends
  - `run` — the function that does the work and returns text
- Two functions in `src/tools.ts`:
  - `toOpenAITool(tool)` — converts a tool into the JSON-Schema `function` shape the OpenAI API understands. The zod schema becomes JSON Schema via `z.toJSONSchema(tool.schema)`.
  - `runTool(tool, rawArgs)` — takes the model's **unvalidated** arguments, validates them with `tool.schema.parse(rawArgs)`, and only then calls `tool.run(args)`.
- `test/tools.test.ts` — uses an `add` tool to check (1) validate-then-run, (2) rejecting bad arguments, (3) that parameters are exposed as JSON Schema.

### Why it matters
The model can't call our functions directly. All it ever sees is a **description**: "there's a function with this name and description, and its arguments look like this." So defining a tool is really building a two-way translator:
- **Outbound** (`toOpenAITool`): our zod schema → JSON Schema the model can read
- **Inbound** (`runTool`): the model's raw arguments → validate → call the real function

The key insight: never trust model output — **always validate against the schema**. That's why `runTool` calls `parse` first. Also note that here we build tools **in isolation**; the agent doesn't actually call them yet. That happens in Lesson 05.

### How to see it
```sh
git checkout lesson-04-defining-a-tool
git diff lesson-03-memory lesson-04-defining-a-tool   # only what changed
```

### Run it
```sh
npm test
```
