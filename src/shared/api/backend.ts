import { env } from '@/shared/config/env';

export async function fetchBackendPing(): Promise<{
  status: string;
  message: string;
  timestamp: string;
}> {
  const res = await fetch(`${env.backendUrl}/system/ping`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Backend request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as { status: string; message: string; timestamp: string };
}
