import { t } from '@/i18n';

export function formatApiError(input: unknown): string {
  if (input instanceof Error) return input.message;
  if (typeof input === 'string') return input;
  if (!input || typeof input !== 'object') return t('errors.unknown');

  const anyObj = input as Record<string, unknown>;
  const message = anyObj.message;

  if (Array.isArray(message)) {
    const parts = message.map((m) => String(m)).filter(Boolean);
    if (parts.length > 0) return parts.join('\n');
  }

  if (typeof message === 'string' && message.trim()) return message;

  if (typeof anyObj.error === 'string' && anyObj.error.trim()) return anyObj.error;

  if (typeof anyObj.statusCode === 'number') {
    return `${t('common.error')} ${anyObj.statusCode}`;
  }

  return t('errors.unknown');
}

export function formatApiErrorFromText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return t('errors.unknown');
  try {
    const parsed = JSON.parse(trimmed);
    return formatApiError(parsed);
  } catch {
    return trimmed;
  }
}
