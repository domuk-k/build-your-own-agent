# Lesson 태그 선형 재빌드 — 설계

작성일: 2026-06-04
대상 레포: build-your-own-agent (origin: github.com/domuk-k/build-your-own-agent, 공개)

## 1. 문제 정의

`git checkout lesson-NN` 으로 학습할 때, 태그가 main의 최신 개선을 담고 있지 않다.
원인은 태그가 "stale"한 게 아니라 **히스토리가 선형인데 모든 개선이 lesson-12 커밋 뒤에
한 덩어리로 쌓여** 어느 lesson 태그에도 들어가지 않은 구조다.

현재 선형 히스토리 (요약):

```
... scaffold, spec
3b89773 lesson 01      [tag lesson-01]   순수 코드
993844a lesson 02      [tag lesson-02]
...
d930790 lesson 12      [tag lesson-12]
418bd83 docs: README + 모든 lessons/*.md   ← 강의글 전체가 여기
44b1242 feat: OPENAI_BASE_URL              ← base URL 픽스
15d629e LICENSE / rename / gateway env / landscape / self-repair (이후)
60c3c48                                    ← 로컬 main HEAD
```

- 태그 11개(01~08, 10~12) 모두 origin에 publish됨, 모두 main의 **선형 조상**.
- `lesson-09` 는 의도적 무(無)태그(개념 레슨 "Why Code > JSON") — 컨벤션 유지.
- main 은 origin/main 보다 2 commit ahead (push 미완, 사용자가 직접 push 예정).

## 2. 목표

각 `lesson-NN` 태그를 self-contained로 재구성한다:

- **base URL 픽스**(`OPENAI_BASE_URL`)가 `llm.ts` 태생 시점(lesson-01)부터 존재 →
  어떤 태그를 checkout 해도 gateway 키(OpenRouter/Vercel)로 401 없이 동작.
- 각 태그에 **누적 강의글**(`lessons/01..NN-*.md`)이 존재.
- 각 강의마다 **번호 매긴 실행 가능한 example**(`examples/NN-*.ts`)이 존재 →
  학습자가 처음(lesson-01)부터 매 강의에서 직접 돌려보며 배운다.
- `lesson-09` 무태그 컨벤션 유지(개념 레슨).

### 핵심 불변식

- 재빌드 후 `lesson-12` 의 `src/` 트리 == 현재 `main` 의 `src/` 트리.
  최종 코드는 한 글자도 바뀌지 않는다. base URL 픽스가 *언제* 등장하는지만 앞으로 이동
  (흡수 후 비어버린 `44b1242` 커밋은 drop).
- 선형이므로 lesson-NN 에서 `lessons/01..NN` 와 `examples/01..NN` 가 자동 누적된다.

## 3. 결정 사항 (확정)

| 항목 | 결정 |
|---|---|
| 토폴로지 | **선형 히스토리 재작성 + 재태깅** (additive 우회 아님) |
| writeup 범위 | **누적** (각 태그에 lessons/01..NN) |
| example 진입점 | **강의마다 번호 example** (examples/NN-*.ts, lessons/NN-*.md 와 1:1, 누적) |
| 검증 깊이 | **Live API 호출 포함** (gateway .env, 호출 간격으로 429 회피) |
| 안전장치 | **백업 ref 생성 후 로컬 재빌드**, push/force-push 는 사용자가 직접 |

## 4. 목표 히스토리 (재작성 후)

각 lesson 커밋이 흡수하는 것:

| 커밋 | 흡수 내용 |
|---|---|
| `lesson-01'` naked-call | `44b1242` base URL 픽스를 `llm.ts` 에 fold + `lessons/01-*.md` + `examples/01-naked-call.ts` + `example:01` script |
| `lesson-02'` the-loop | `lessons/02-*.md` + `examples/02-the-loop.ts` |
| `lesson-03'` memory | `lessons/03-*.md` + `examples/03-memory.ts` |
| `lesson-04'` defining-a-tool | `lessons/04-*.md` + `examples/04-defining-a-tool.ts` (API 불필요) |
| `lesson-05'` tool-calling-agent | `lessons/05-*.md` + `examples/05-tool-calling-agent.ts` |
| `lesson-06'` final-answer | `lessons/06-*.md` + `examples/06-final-answer.ts` |
| `lesson-07'` system-prompt | `lessons/07-*.md` + `examples/07-system-prompt.ts` |
| `lesson-08'` monitoring | `lessons/08-*.md` + `examples/08-monitoring.ts` |
| `lesson-10'` the-sandbox | `lessons/09-*.md`(무태그 개념강 동반) + `lessons/10-*.md` + `examples/10-the-sandbox.ts` (API 불필요) |
| `lesson-11'` code-agent | `lessons/11-*.md` + `examples/11-code-agent.ts` |
| `lesson-12'` a-real-agent | `lessons/12-*.md` + `examples/12-a-real-agent.ts` (end-to-end) |
| 이후 main | 비워진 writeups 커밋의 잔여(README), LICENSE, rename, gateway env, landscape, self-repair 그대로 |

### example 진입점 (각 시점에 export 확인 완료)

| 강의 | 호출 진입점 | Live API |
|---|---|---|
| 01 | `callLLM(messages)` | 예 |
| 02 | `runSimpleAgent(task)` | 예 |
| 03 | `startMemory` / `remember` (+ callLLM) | 예 |
| 04 | `runTool(tool, args)` / `toOpenAITool` | **아니오** (로컬 데모) |
| 05 | `runAgent(task, tools)` | 예 |
| 06 | `runAgent` (final_answer 종료) | 예 |
| 07 | `runAgent` (시스템 프롬프트) | 예 |
| 08 | `runAgent` (monitor 출력) | 예 |
| 10 | `runCode(code, tools)` | **아니오** (vm 로컬 실행) |
| 11 | `runCodeAgent(task, tools)` | 예 |
| 12 | end-to-end (tool + code) | 예 |

- `lesson-05` 에서 `runAgent` 는 `MAX_TURNS` 가드 + 직접답변 시 return 으로 종료 검증됨 →
  example 이 무한루프 없이 동작.
- `package.json` 의 `scripts` 블록은 각 lesson 커밋에서 `example:NN` 가 점진 추가된다.

### naming 결정 필요 (스펙 리뷰에서 확정)

기존 example 파일은 `examples/tool-agent.ts`, `examples/code-agent.ts`(번호 없음).
번호 매칭 스킴(`examples/05-tool-calling-agent.ts`, `examples/11-code-agent.ts`)으로
통일하려면 이 둘을 **rename** 하고 `package.json` 스크립트(`example:tool`/`example:code`)와
README 참조를 갱신해야 한다.

- **권장**: 번호 스킴으로 통일(lessons/NN ↔ examples/NN 1:1, 학습 동선 일관).
  → 기존 `example:tool`/`example:code` 는 `example:05`/`example:11` 로 대체(또는 alias 유지).
- `examples/self-repair-demo.ts` 는 lesson-12 이후 추가물(범위 밖)이라 그대로 둔다 —
  어떤 lesson 태그에도 넣지 않음(main 에만 존재).

## 5. 재작성 메커니즘

`git rebase -i b0910d0`(또는 scaffold/spec 직후 base)로 각 lesson 커밋을 `edit` 표시,
각 정지점에서:

```
git checkout <writeups-src> -- lessons/NN-*.md       # 해당 강의글
# 해당 example 작성/배치 + package.json script 추가
git add -A && git commit --amend --no-edit
```

- **lesson-01 base URL fold**: `44b1242` 의 `llm.ts` 변경을 lesson-01 커밋에 흡수.
- **충돌 규칙**: 이후 lesson 들이 `llm.ts` 를 수정하며 replay 될 때 URL 라인 충돌 시
  항상 `BASE_URL` 버전 채택.
- 비워진 `44b1242` 커밋은 drop. `418bd83` 는 lessons/*.md 를 lesson 커밋으로 옮긴 뒤
  남는 README 부분만 유지.
- 대안: `git commit-tree` 기반 결정론적 트리 재구성(각 lesson 의 알려진 src 스냅샷 +
  픽스 + writeup + example). plan 단계에서 rebase vs commit-tree 중 안전한 쪽 선택.

## 6. 안전 / 검증

### 백업

force-push 전, 기존 11개 태그를 백업 ref 로 보존:

```
for t in $(git tag -l 'lesson-*'); do git tag "backup/$t" "$t"; done
# (또는 lesson-NN-old 네이밍)
```

원격 백업이 필요하면 백업 ref 도 별도 push(사용자 결정).

### 재빌드 범위

- 모든 재작성·재태깅·백업·검증은 **로컬에서만** 수행.
- main 도 SHA 가 바뀌므로 main force-push 가 필요하다. 실제 `push` /
  `push --force-with-lease origin main` / 태그 force-push 명령은 **사용자에게 넘긴다**
  (글로벌 규칙: 허락 없이 push 금지). 명령 묶음을 함께 제공.

### 태그별 검증

각 재빌드된 태그를 checkout 한 뒤:

1. `node --test`(해당 시점 test 통과) + `tsgo --noEmit`(typecheck).
2. 해당 강의 example 을 gateway `.env`(`OPENAI_BASE_URL=...`)로 실행 →
   base URL 이 수동패치 없이 동작함을 확인(핸드오프 item 4).
   - Live API example 은 무료티어 429 회피를 위해 **호출 간격**을 둔다.
   - 04(tool 정의), 10(sandbox)는 API 불필요 → quota 없이 검증.
   - quota 우려 시 대표 태그(01 naked / 05 tool-agent / 11 code-agent)만 live,
     나머지는 test+typecheck 로 샘플링 가능(스펙 리뷰에서 확정).

## 7. force-push 영향 최소화

- `git checkout lesson-NN` 은 태그 **이름**으로 참조 → 재태깅 후에도 이름이 같은
  sane 한 커밋을 가리키므로 신규 clone / 강의 링크는 그대로 동작.
- 깨지는 경우: 이미 clone 해두고 `git fetch` 만 하는 사용자(태그가 자동 갱신 안 됨,
  `git fetch --tags --force` 필요). 학습 레포 특성상 허용 가능.
- README 에 "태그 재빌드됨, 최신 학습은 `git fetch --tags --force`" 안내 한 줄 추가 고려.

## 8. 범위 밖 (재논의 불필요)

- `docs/beyond-the-loop-agent-landscape.md`(e4bfd87), `examples/self-repair-demo.ts`(60c3c48)
  는 이미 완료·커밋됨. lesson 태그에 편입하지 않고 main 후행 커밋으로 유지.
- base URL 픽스 구현 자체(44b1242)는 이미 존재 — 새로 구현하지 않고 시점만 이동.

## 9. 미결 (스펙 리뷰에서 확정)

- (a) example naming: 번호 스킴으로 기존 2개 rename(권장) vs 기존 이름 유지.
- (b) 검증에서 live API 를 전 태그에 돌릴지 vs 대표 샘플 + 나머지 test.
- (c) 백업 ref 네이밍(`backup/lesson-NN` vs `lesson-NN-old`)과 원격 push 여부.
