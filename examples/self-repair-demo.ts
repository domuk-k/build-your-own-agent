// ─────────────────────────────────────────────────────────────
// 교육용 데모 — CodeAgent 의 self-repair(에러를 읽고 스스로 고치는) 루프를
// "운에 기대지 않고" 결정적으로 재현한다.
//
// 11강에서 우연히 관찰됐던 것: 모델이 코드를 잘못 짜면, runCodeAgent 의 catch
// 블록이 에러 메시지를 *다음 턴의 입력*으로 되돌려주고, 모델이 그걸 읽고 고친다.
// 하지만 그건 모델이 우연히 틀려야만 보였다. 여기서는 그 실패를 *설계*한다.
//
// 결정적으로 만드는 핵심: calculator 의 *첫 유효 호출*은 반드시 일시적 에러를
// 던진다. 모델이 무엇을 하든(인자를 맞히든 틀리든) 일단 올바른 인자로 한 번
// 부르면 그 호출이 실패하고, 에러 메시지가 곧 해결법("같은 호출을 재시도하라")이다.
//   turn N   : calculator(...) 올바른 호출 → 일시적 에러 throw → 에이전트가 되돌림
//   turn N+1 : 모델이 에러를 읽고 같은 호출 재시도 → 성공 → final_answer
// "재시도하면 된다"는 정보가 오직 에러에만 있으므로, 모델은 preempt 할 수 없다.
// → 모델 종류와 무관하게 self-repair 루프가 항상 1회 이상 발생한다.
//
// (인자 이름 실수를 줄이려 호출 규약을 description 에 적어, 데모의 초점을
//  "transient 에러로부터의 자기 복구"에 맞췄다.)
//
// 실행: node --env-file=.env --import tsx examples/self-repair-demo.ts
// ─────────────────────────────────────────────────────────────
import { z } from "zod";
import type { Tool } from "../src/types.ts";
import { runCodeAgent } from "../src/code-agent.ts";

// 모듈 수준 상태 — 도구 호출들 사이에서 유지된다(같은 Tool 객체를 공유하므로).
let validCallCount = 0;

const calculator: Tool = {
  name: "calculator",
  description:
    "Compute arithmetic on two numbers. Call as calculator({ a, op, b }) " +
    "where op is one of '+', '-', '*', '/'. Example: calculator({ a: 6, op: '*', b: 7 }).",
  schema: z.object({
    a: z.number(),
    op: z.enum(["+", "-", "*", "/"]),
    b: z.number(),
  }),
  run: ({ a, op, b }) => {
    // 스키마 검증을 통과한(=유효 인자) 첫 호출은 일부러 실패시킨다.
    validCallCount += 1;
    if (validCallCount === 1) {
      throw new Error(
        "Transient backend error on the first call (this is expected in the demo). " +
          "Run the same calculation once more, then pass its result to final_answer().",
      );
    }
    return String(op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b);
  },
};

const answer = await runCodeAgent(
  "Use the calculator to compute 23 * 19, then return the result with final_answer.",
  [calculator],
);
console.log("\n=== FINAL ANSWER ===\n", answer);
