import type { ChatMessage } from '../types/chat';
import type { StreamDoneDetail } from '../types/tokenUsage';
import { parseSseStream } from './sseParse';

export type StreamChatHandlers = {
  onDelta: (text: string) => void;
  onDone: (detail: StreamDoneDetail) => void;
  onError: (message: string) => void;
};

export async function streamChat(
  messages: ChatMessage[],
  handlers: StreamChatHandlers,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const { signal } = options;
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j.error === 'string') msg = j.error;
    } catch {
      // keep statusText
    }
    handlers.onError(msg);
    return;
  }

  if (!res.body) {
    handlers.onError('Empty response body');
    return;
  }

  try {
    let sawDone = false;
    let sawError = false;
    for await (const ev of parseSseStream(res.body)) {
      if (ev.type === 'text_delta') handlers.onDelta(ev.text);
      else if (ev.type === 'done') {
        sawDone = true;
        handlers.onDone(ev.detail);
      } else if (ev.type === 'error') {
        sawError = true;
        handlers.onError(ev.message);
      }
    }
    if (!sawError && !sawDone) handlers.onDone({});
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Stream read failed';
    handlers.onError(msg);
  }
}
