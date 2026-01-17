export function formatApiError(input: unknown): string {
  if (input instanceof Error) return input.message;
  if (typeof input === 'string') return input;
  if (!input || typeof input !== 'object') return 'Unknown error';

  const anyObj = input as Record<string, unknown>;
  const message = anyObj.message;

  if (Array.isArray(message)) {
    const parts = message.map((m) => String(m)).filter(Boolean);
    if (parts.length > 0) return parts.join('\n');
  }

  if (typeof message === 'string' && message.trim()) return message;

  if (typeof anyObj.error === 'string' && anyObj.error.trim()) return anyObj.error;

  if (typeof anyObj.statusCode === 'number') return `Error ${anyObj.statusCode}`;

  return 'Unknown error';
}

export function formatApiErrorFromText(text: string): string {
  const t = text.trim();
  if (!t) return 'Unknown error';
  try {
    const parsed = JSON.parse(t);
    return formatApiError(parsed);
  } catch {
    return t;
  }
}
