// ─────────────────────────────────────────────────────────────
// types.ts — the SHAPES of smallagentjs.
//
// Read this file first. It says WHAT data flows through the system.
// It contains no logic — every other file imports its types from here,
// so you can learn the vocabulary before you read any behavior.
// ─────────────────────────────────────────────────────────────

import type { ZodType } from "zod";

/** Who is speaking in a conversation. */
export type Role = "system" | "user" | "assistant" | "tool";

/** One message in a conversation. The whole framework moves these around. */
export type Message = {
  role: Role;
  content: string;
};

/**
 * A capability the agent is allowed to call.
 * - `schema` validates the arguments the model sends (a zod schema).
 * - `run` does the work and returns text the agent reads back.
 * (Added in Lesson 04.)
 */
export type Tool = {
  name: string;
  description: string;
  schema: ZodType;
  run: (args: any) => string | Promise<string>;
};
