import { describe, expect, it } from 'vitest';
import { parseSseStream } from './sseParse';

function streamFromString(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe('parseSseStream', () => {
  it('reads browser-like Response body built from string', async () => {
    const raw =
      'data: {"type":"text_delta","text":"Hello"}\n\n' +
      'data: {"type":"done"}\n\n';
    const res = new Response(raw, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    });
    expect(res.body).toBeTruthy();
    const events: { type: string; text?: string }[] = [];
    for await (const ev of parseSseStream(res.body!)) {
      events.push(ev);
    }
    expect(events).toEqual([
      { type: 'text_delta', text: 'Hello' },
      { type: 'done', detail: {} },
    ]);
  });

  it('yields text_delta and done from SSE payload', async () => {
    const raw =
      'data: {"type":"text_delta","text":"Hi"}\n\n' + 'data: {"type":"done"}\n\n';
    const events: { type: string; text?: string }[] = [];
    for await (const ev of parseSseStream(streamFromString(raw))) {
      events.push(ev);
    }
    expect(events).toEqual([
      { type: 'text_delta', text: 'Hi' },
      { type: 'done', detail: {} },
    ]);
  });

  it('parses done with usage and context_window', async () => {
    const raw =
      'data: {"type":"done","usage":{"input_tokens":100,"output_tokens":42},"context_window":200000}\n\n';
    const events: unknown[] = [];
    for await (const ev of parseSseStream(streamFromString(raw))) {
      events.push(ev);
    }
    expect(events).toEqual([
      {
        type: 'done',
        detail: { usage: { input_tokens: 100, output_tokens: 42 }, context_window: 200000 },
      },
    ]);
  });

  it('handles chunked delivery', async () => {
    const raw = 'data: {"type":"text_delta","text":"a"}\n\ndata: {"type":"text_delta","text":"b"}\n\n';
    let out = '';
    for await (const ev of parseSseStream(streamFromString(raw))) {
      if (ev.type === 'text_delta') out += ev.text;
    }
    expect(out).toBe('ab');
  });
});
