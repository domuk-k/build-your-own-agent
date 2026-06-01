// ─────────────────────────────────────────────────────────────
// Lesson 01 — The Naked Call   (extended in Lesson 05 for tool calling)
//
// An LLM is just an HTTP request. This is the only file that talks to
// the network. Lesson 05 adds a second function that lets the model
// ask to use tools — but it shares the same POST helper.
// ─────────────────────────────────────────────────────────────

import type { Message, ToolCall, Tool } from "./types.ts";
import { toOpenAITool } from "./tools.ts";

// Any OpenAI-compatible endpoint works: OpenAI, OpenRouter, Vercel AI
// Gateway, a local server. Override OPENAI_BASE_URL to point elsewhere —
// e.g. https://openrouter.ai/api/v1 with a free model in OPENAI_MODEL.
const BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

/** POST one chat-completion request and return the raw JSON body. */
async function chatCompletion(body: Record<string, unknown>): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY (see .env.example)");

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      ...body,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

/** Lesson 01: the simplest call — messages in, reply text out. */
export async function callLLM(messages: Message[]): Promise<string> {
  const data = await chatCompletion({ messages: toOpenAIMessages(messages) });
  return data.choices[0].message.content;
}

/** Lesson 05: a richer call that may ask to use one or more tools. */
export async function callLLMWithTools(
  messages: Message[],
  tools: Tool[],
): Promise<Message> {
  const data = await chatCompletion({
    messages: toOpenAIMessages(messages),
    tools: tools.map(toOpenAITool),
    tool_choice: "auto",
  });
  const reply = data.choices[0].message;
  return {
    role: "assistant",
    content: reply.content ?? "",
    toolCalls: parseToolCalls(reply.tool_calls),
  };
}

/** Translate our Message[] into the exact shape the OpenAI API expects. */
function toOpenAIMessages(messages: Message[]): unknown[] {
  return messages.map((m) => {
    if (m.role === "tool") {
      return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
    }
    if (m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.arguments) },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

/** Read the model's tool requests out of the API response. */
function parseToolCalls(raw: any[] | undefined): ToolCall[] | undefined {
  if (!raw?.length) return undefined;
  return raw.map((c) => ({
    id: c.id,
    name: c.function.name,
    arguments: c.function.arguments ? JSON.parse(c.function.arguments) : {},
  }));
}
