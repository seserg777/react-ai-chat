import type { ChatMessage, ChatThread } from '../types/chat';

const TITLE_LEN = 48;

export function threadTitleFromMessage(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= TITLE_LEN) return t || 'New chat';
  return `${t.slice(0, TITLE_LEN)}…`;
}

export function createEmptyThread(): ChatThread {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    messages: [],
    updatedAt: now,
  };
}

export function makeThread(firstUserMessage: string): ChatThread {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: threadTitleFromMessage(firstUserMessage),
    messages: [{ role: 'user', content: firstUserMessage }],
    updatedAt: now,
  };
}

export function appendAssistantShell(messages: ChatMessage[]): ChatMessage[] {
  return [...messages, { role: 'assistant', content: '' }];
}
