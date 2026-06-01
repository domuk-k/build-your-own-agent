// ─────────────────────────────────────────────────────────────
// types.ts — the SHAPES of smallagentjs.
//
// Read this file first. It says WHAT data flows through the system.
// It contains no logic — every other file imports its types from here,
// so you can learn the vocabulary before you read any behavior.
// ─────────────────────────────────────────────────────────────

/** Who is speaking in a conversation. */
export type Role = "system" | "user" | "assistant" | "tool";

/** One message in a conversation. The whole framework moves these around. */
export type Message = {
  role: Role;
  content: string;
};
