'use client';

import type { HealthCheck, SystemMetrics } from '@/entities/system/types/system';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  try {
    const json = await res.json();
    return formatApiErrorFromText(JSON.stringify(json));
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function getHealthCheck(): Promise<HealthCheck> {
  const res = await fetch('/api/system/health-check', {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as HealthCheck;
}

export async function getMetrics(): Promise<SystemMetrics> {
  const res = await fetch('/api/system/metrics', {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as SystemMetrics;
}
