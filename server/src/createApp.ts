import express from 'express';
import cors from 'cors';
import type { StreamDeps } from './streamGemini.js';
import { streamChatToSse } from './streamGemini.js';
import { validateChatBody, ValidationError } from './validateChatBody.js';

export type CreateAppOptions = {
  streamDeps?: StreamDeps | null;
  corsOrigin?: string | string[];
};

/**
 * Express app factory. Pass streamDeps for production; tests inject mock deps.
 */
export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const corsOrigin = options.corsOrigin ?? ['http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(
    cors({
      origin: corsOrigin,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/chat', async (req, res) => {
    let messages;
    try {
      messages = validateChatBody(req.body);
    } catch (e) {
      if (e instanceof ValidationError) {
        return res.status(400).json({ error: e.message });
      }
      throw e;
    }

    const deps = options.streamDeps;
    if (!deps) {
      return res.status(503).json({ error: 'Chat service is not configured' });
    }

    await streamChatToSse(res, messages, deps);
  });

  return app;
}
