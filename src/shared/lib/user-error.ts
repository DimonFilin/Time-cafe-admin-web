import { t } from '@/i18n';

/** User-visible error text: prefer API message, else i18n fallback key. */
export function userErrorMessage(err: unknown, fallbackKey: string): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === 'string' && err.trim()) {
    return err;
  }
  return t(fallbackKey);
}

/** Parse JSON error body from fetch response helpers. */
export function errorFromBody(
  body: { message?: string; error?: string },
  fallbackKey: string,
): string {
  return body.message || body.error || t(fallbackKey);
}
