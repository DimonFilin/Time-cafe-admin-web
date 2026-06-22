'use client';

/**
 * Client-side fetch wrapper with token handling
 * For use in client components
 */

import { fetchWithAuthRetry } from '@/shared/lib/fetch-with-retry';
import { t } from '@/i18n';

function messageFromErrorBody(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    if (typeof o.error === 'string' && o.error.trim()) return o.error;
  }
  return `${t('common.error')} ${status}`;
}

export async function clientFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuthRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(messageFromErrorBody(error, response.status));
  }

  return response.json();
}
