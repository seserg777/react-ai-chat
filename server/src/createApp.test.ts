import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { GenerativeModel } from '@google/generative-ai';
import { createApp } from './createApp.js';

function mockGeminiStream(
  chunks: string[],
  usage: { input_tokens: number; output_tokens: number } = { input_tokens: 100, output_tokens: 20 },
) {
  const usageMetadata = {
    promptTokenCount: usage.input_tokens,
    candidatesTokenCount: usage.output_tokens,
    totalTokenCount: usage.input_tokens + usage.output_tokens,
  };
  return {
    async generateContentStream() {
      async function* stream() {
        for (const text of chunks) {
          yield {
            text: () => text,
          };
        }
      }
      return {
        stream: stream(),
        response: Promise.resolve({
          text: () => chunks.join(''),
          usageMetadata,
        }),
      };
    },
  } as unknown as GenerativeModel;
}

describe('POST /api/chat', () => {
  it('returns 400 for invalid body', async () => {
    const app = createApp({
      streamDeps: {
        model: mockGeminiStream([]),
      },
    });

    const res = await request(app).post('/api/chat').send({ messages: [] });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });

  it('returns 503 when service not configured', async () => {
    const app = createApp({ streamDeps: null });
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(res.status).toBe(503);
    expect(res.body.error).toBeDefined();
  });

  it('streams SSE events when Gemini yields deltas', async () => {
    const app = createApp({
      streamDeps: {
        model: mockGeminiStream(['Hel', 'lo'], { input_tokens: 40, output_tokens: 2 }),
        contextWindowTokens: 200000,
      },
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    const raw = res.text;
    expect(raw).toContain('"type":"text_delta"');
    expect(raw).toContain('Hel');
    expect(raw).toContain('lo');
    expect(raw).toContain('"type":"done"');
    expect(raw).toContain('"input_tokens":40');
    expect(raw).toContain('"output_tokens":2');
    expect(raw).toContain('"context_window":200000');
  });
});
