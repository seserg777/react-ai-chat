import 'dotenv/config';
import { createServer } from 'node:http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createApp } from './createApp.js';

const PORT = Number(process.env.PORT) || 3001;
const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

function parseContextWindow(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

const contextWindowTokens = parseContextWindow(process.env.GEMINI_CONTEXT_WINDOW);

const streamDeps =
  apiKey != null && apiKey !== ''
    ? {
        model: new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName }),
        contextWindowTokens,
      }
    : null;

const app = createApp({ streamDeps });
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`);
  if (!streamDeps) {
    console.warn('GEMINI_API_KEY is missing; POST /api/chat will return 503');
  }
});
