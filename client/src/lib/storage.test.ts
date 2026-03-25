import { describe, expect, it, beforeEach } from 'vitest';
import { loadChatThreads, saveChatThreads } from './storage';
import type { ChatThread } from '../types/chat';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips threads', () => {
    const threads: ChatThread[] = [
      {
        id: '1',
        title: 'T',
        messages: [{ role: 'user', content: 'hi' }],
        updatedAt: 1,
      },
    ];
    saveChatThreads(threads);
    expect(loadChatThreads()).toEqual(threads);
  });

  it('returns [] on corrupt JSON', () => {
    localStorage.setItem('react-ai-chat-threads-v1', 'not-json');
    expect(loadChatThreads()).toEqual([]);
  });
});
