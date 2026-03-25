import type { StreamDoneDetail } from '../types/tokenUsage';

export type SseClientEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'done'; detail: StreamDoneDetail }
  | { type: 'error'; message: string };

function parseDoneDetail(payload: Record<string, unknown>): StreamDoneDetail {
  const detail: StreamDoneDetail = {};
  const u = payload.usage;
  if (
    u &&
    typeof u === 'object' &&
    typeof (u as { input_tokens?: unknown }).input_tokens === 'number' &&
    typeof (u as { output_tokens?: unknown }).output_tokens === 'number'
  ) {
    detail.usage = {
      input_tokens: (u as { input_tokens: number }).input_tokens,
      output_tokens: (u as { output_tokens: number }).output_tokens,
    };
  }
  const cw = payload.context_window;
  if (cw === null) detail.context_window = null;
  else if (typeof cw === 'number' && Number.isFinite(cw)) detail.context_window = cw;
  return detail;
}

function* parseBlocks(blocks: string[]): Generator<SseClientEvent> {
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const payload = JSON.parse(jsonStr) as Record<string, unknown>;
        if (payload.type === 'text_delta' && typeof payload.text === 'string') {
          yield { type: 'text_delta', text: payload.text };
        } else if (payload.type === 'done') {
          yield { type: 'done', detail: parseDoneDetail(payload) };
        } else if (payload.type === 'error' && typeof payload.message === 'string') {
          yield { type: 'error', message: payload.message };
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }
}

/**
 * Parse SSE lines from a fetch Response body (data: {...} blocks).
 */
export async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SseClientEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      if (value && value.length > 0) {
        buffer += decoder.decode(value, { stream: false });
      } else {
        buffer += decoder.decode();
      }
    } else if (value) {
      buffer += decoder.decode(value, { stream: true });
    }

    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const ev of parseBlocks(parts)) {
      yield ev;
    }

    if (done) {
      if (buffer.trim()) {
        for (const ev of parseBlocks([buffer])) {
          yield ev;
        }
      }
      break;
    }
  }
}
