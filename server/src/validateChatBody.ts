export type ChatMessageInput = { role: 'user' | 'assistant'; content: string };

const MAX_MESSAGES = 200;
const MAX_CONTENT_LENGTH = 120_000;

export function validateChatBody(body: unknown): ChatMessageInput[] {
  if (body === null || typeof body !== 'object') {
    throw new ValidationError('Body must be a JSON object');
  }
  const { messages } = body as { messages?: unknown };
  if (!Array.isArray(messages)) {
    throw new ValidationError('messages must be an array');
  }
  if (messages.length === 0) {
    throw new ValidationError('messages must not be empty');
  }
  if (messages.length > MAX_MESSAGES) {
    throw new ValidationError(`messages must have at most ${MAX_MESSAGES} items`);
  }

  const out: ChatMessageInput[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m === null || typeof m !== 'object') {
      throw new ValidationError(`messages[${i}] must be an object`);
    }
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') {
      throw new ValidationError(`messages[${i}].role must be "user" or "assistant"`);
    }
    if (typeof content !== 'string') {
      throw new ValidationError(`messages[${i}].content must be a string`);
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new ValidationError(`messages[${i}].content is too long`);
    }
    out.push({ role, content });
  }

  return out;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
