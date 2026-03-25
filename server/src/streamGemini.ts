import type { Content, GenerativeModel } from '@google/generative-ai';
import type { Response } from 'express';
import type { ChatMessageInput } from './validateChatBody.js';
import { initSse, writeSseEvent } from './sse.js';

export type StreamDeps = {
  model: GenerativeModel;
  /** Approximate model context window for UI "remaining" hint (optional). */
  contextWindowTokens?: number | null;
};

function toGeminiRole(role: ChatMessageInput['role']): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

/** Gemini expects a user/model alternation; merge consecutive same-role turns. Strip leading assistant-only prefix. */
function messagesToGeminiContents(messages: ChatMessageInput[]): Content[] {
  const trimmed = [...messages];
  while (trimmed.length > 0 && trimmed[0].role === 'assistant') {
    trimmed.shift();
  }
  if (trimmed.length === 0) {
    throw new Error('No user messages after normalizing history for Gemini');
  }

  const merged: ChatMessageInput[] = [];
  for (const msg of trimmed) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n\n${msg.content}`;
    } else {
      merged.push({ role: msg.role, content: msg.content });
    }
  }

  return merged.map((m) => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.content }],
  }));
}

/**
 * Stream Gemini completion to the client as SSE: text_delta chunks + done | error.
 */
export async function streamChatToSse(
  res: Response,
  messages: ChatMessageInput[],
  deps: StreamDeps,
): Promise<void> {
  initSse(res);

  let contents: Content[];
  try {
    contents = messagesToGeminiContents(messages);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid messages for Gemini';
    writeSseEvent(res, { type: 'error', message });
    res.end();
    return;
  }

  try {
    const { stream, response } = await deps.model.generateContentStream({ contents });

    for await (const chunk of stream) {
      try {
        const text = chunk.text();
        if (text) {
          writeSseEvent(res, { type: 'text_delta', text });
        }
      } catch {
        // Blocked or empty candidate in this chunk; continue stream.
      }
    }

    let usage: { input_tokens: number; output_tokens: number } | undefined;
    try {
      const final = await response;
      const um = final.usageMetadata;
      if (
        um &&
        typeof um.promptTokenCount === 'number' &&
        typeof um.candidatesTokenCount === 'number'
      ) {
        usage = {
          input_tokens: um.promptTokenCount,
          output_tokens: um.candidatesTokenCount,
        };
      }
    } catch {
      // Aggregated response unavailable (e.g. test doubles).
    }

    const ctx = deps.contextWindowTokens;
    writeSseEvent(res, {
      type: 'done',
      ...(usage ? { usage } : {}),
      ...(ctx != null && ctx > 0 ? { context_window: ctx } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    writeSseEvent(res, { type: 'error', message });
  } finally {
    res.end();
  }
}
