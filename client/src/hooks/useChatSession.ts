import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatThread } from '../types/chat';
import type { StreamDoneDetail, TokenTurnUsage } from '../types/tokenUsage';
import { streamChat } from '../lib/chatApi';
import { loadChatThreads, saveChatThreads } from '../lib/storage';
import { appendAssistantShell, createEmptyThread, threadTitleFromMessage } from '../lib/threadUtils';
import { buildApiMessages } from '../lib/messagesForApi';

export function useChatSession() {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const loaded = loadChatThreads();
    return loaded.length > 0 ? loaded : [createEmptyThread()];
  });
  const [activeId, setActiveId] = useState<string | null>(() => loadChatThreads()[0]?.id ?? null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<TokenTurnUsage | null>(null);
  const [sessionTokenIn, setSessionTokenIn] = useState(0);
  const [sessionTokenOut, setSessionTokenOut] = useState(0);
  const [contextWindowHint, setContextWindowHint] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadsRef = useRef(threads);
  const activeIdRef = useRef(activeId);
  const streamingRef = useRef(streaming);

  threadsRef.current = threads;
  activeIdRef.current = activeId;
  streamingRef.current = streaming;

  useLayoutEffect(() => {
    setActiveId((id) => (id != null ? id : threads[0]?.id ?? null));
  }, [threads]);

  useEffect(() => {
    const t = window.setTimeout(() => saveChatThreads(threads), 400);
    return () => window.clearTimeout(t);
  }, [threads]);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const applyDoneDetail = useCallback((detail: StreamDoneDetail) => {
    if (detail.usage) {
      const { input_tokens, output_tokens } = detail.usage;
      setLastTokenUsage({ input_tokens, output_tokens });
      setSessionTokenIn((n) => n + input_tokens);
      setSessionTokenOut((n) => n + output_tokens);
    }
    if (detail.context_window != null && Number.isFinite(detail.context_window) && detail.context_window > 0) {
      setContextWindowHint(Math.floor(detail.context_window));
    }
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setError(null);
    const thread: ChatThread = {
      id: crypto.randomUUID(),
      title: 'New chat',
      messages: [],
      updatedAt: Date.now(),
    };
    setThreads((prev) => [thread, ...prev]);
    setActiveId(thread.id);
  }, []);

  const selectChat = useCallback((id: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setError(null);
    setActiveId(id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = createEmptyThread();
        setActiveId(fresh.id);
        return [fresh];
      }
      setActiveId((cur) => (cur === id ? next[0]!.id : cur));
      return next;
    });
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || streamingRef.current) return;
    const aid = activeIdRef.current;
    if (!aid) return;

    const match = threadsRef.current.find((t) => t.id === aid);
    if (!match) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setError(null);
    setStreaming(true);

    const streamThreadId = aid;

    const withUser: ChatThread = {
      ...match,
      messages: [...match.messages, { role: 'user' as const, content: trimmed }],
      title:
        match.messages.length === 0 ? threadTitleFromMessage(trimmed) : match.title,
      updatedAt: Date.now(),
    };
    const threadSnapshot: ChatThread = {
      ...withUser,
      messages: appendAssistantShell(withUser.messages),
    };

    setThreads((prev) => prev.map((t) => (t.id === streamThreadId ? threadSnapshot : t)));

    const apiMessages = buildApiMessages(threadSnapshot.messages);

    await streamChat(
      apiMessages,
      {
        onDelta: (text) => {
          setThreads((prev) =>
            prev.map((th) => {
              if (th.id !== streamThreadId) return th;
              const msgs = [...th.messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === 'assistant') {
                msgs[msgs.length - 1] = { ...last, content: last.content + text };
              }
              return { ...th, messages: msgs, updatedAt: Date.now() };
            }),
          );
        },
        onDone: (detail) => {
          applyDoneDetail(detail);
          setStreaming(false);
          abortRef.current = null;
        },
        onError: (msg) => {
          setError(msg);
          setStreaming(false);
          abortRef.current = null;
          setThreads((prev) =>
            prev.map((th) => {
              if (th.id !== streamThreadId) return th;
              const msgs = [...th.messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === 'assistant' && last.content === '') {
                msgs.pop();
              }
              return { ...th, messages: msgs, updatedAt: Date.now() };
            }),
          );
        },
      },
      { signal: ctrl.signal },
    );
  }, [applyDoneDetail]);

  const retryAfterError = useCallback(async () => {
    const aid = activeIdRef.current;
    if (!aid || streamingRef.current) return;
    const cur = threadsRef.current.find((t) => t.id === aid);
    if (!cur) return;

    setError(null);
    const msgs = cur.messages;
    if (msgs.length === 0) return;
    const last = msgs[msgs.length - 1];
    let base = msgs;
    if (last?.role === 'assistant') {
      base = msgs.slice(0, -1);
    }
    if (base.length === 0) return;

    const streamThreadId = aid;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming(true);

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== streamThreadId) return t;
        return {
          ...t,
          messages: appendAssistantShell(base),
          updatedAt: Date.now(),
        };
      }),
    );

    await streamChat(
      buildApiMessages(appendAssistantShell(base)),
      {
        onDelta: (text) => {
          setThreads((prev) =>
            prev.map((th) => {
              if (th.id !== streamThreadId) return th;
              const m = [...th.messages];
              const la = m[m.length - 1];
              if (la?.role === 'assistant') {
                m[m.length - 1] = { ...la, content: la.content + text };
              }
              return { ...th, messages: m, updatedAt: Date.now() };
            }),
          );
        },
        onDone: (detail) => {
          applyDoneDetail(detail);
          setStreaming(false);
          abortRef.current = null;
        },
        onError: (msg) => {
          setError(msg);
          setStreaming(false);
          abortRef.current = null;
          setThreads((prev) =>
            prev.map((th) => {
              if (th.id !== streamThreadId) return th;
              const m = [...th.messages];
              if (m[m.length - 1]?.role === 'assistant') m.pop();
              return { ...th, messages: m, updatedAt: Date.now() };
            }),
          );
        },
      },
      { signal: ctrl.signal },
    );
  }, [applyDoneDetail]);

  return {
    threads,
    activeId,
    activeThread,
    streaming,
    error,
    lastTokenUsage,
    sessionTokenIn,
    sessionTokenOut,
    contextWindowHint,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
    dismissError,
    retryAfterError,
  };
}
