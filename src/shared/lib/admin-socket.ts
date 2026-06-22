'use client';

import { io, type Socket } from 'socket.io-client';

const wsUrl = process.env.NEXT_PUBLIC_SHARED_API_URL || 'http://localhost:3000';

async function fetchWsToken(): Promise<string | null> {
  const res = await fetch('/api/auth/ws-token', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}

export async function connectAdminSocket(namespace: string): Promise<Socket | null> {
  const token = await fetchWsToken();
  if (!token) return null;

  return io(`${wsUrl}${namespace}`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    auth: { token },
  });
}

export { wsUrl };
