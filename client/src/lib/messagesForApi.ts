import type { ChatMessage } from '../types/chat';

/** Strip trailing empty assistant placeholder before calling the API. */
export function buildApiMessages(messages: ChatMessage[]): ChatMessage[] {
  const out = [...messages];
  const last = out[out.length - 1];
  if (last?.role === 'assistant' && last.content === '') {
    out.pop();
  }
  return out;
}
