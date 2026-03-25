import type { ChatThread } from '../types/chat';

const STORAGE_KEY = 'react-ai-chat-threads-v1';

export function loadChatThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data as ChatThread[];
  } catch {
    return [];
  }
}

export function saveChatThreads(threads: ChatThread[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Quota or private mode — ignore for demo
  }
}
