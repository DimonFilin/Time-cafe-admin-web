'use client';

import { io, type Socket } from 'socket.io-client';

const configuredWsUrl = process.env.NEXT_PUBLIC_SHARED_API_URL || 'http://localhost:3000';

/** Avoid mixed content: HTTPS admin must use WSS (https API origin). */
export function resolveSharedApiUrl(): string {
  if (typeof window === 'undefined') return configuredWsUrl;

  if (window.location.protocol !== 'https:') return configuredWsUrl;

  if (configuredWsUrl.startsWith('https://')) return configuredWsUrl;

  const pageHost = window.location.hostname;
  if (pageHost.includes('sslip.io') && pageHost.startsWith('admin.')) {
    return `https://${pageHost.replace(/^admin\./, 'api.')}`;
  }

  if (configuredWsUrl.startsWith('http://')) {
    return configuredWsUrl.replace(/^http:\/\//, 'https://');
  }

  return configuredWsUrl;
}

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

  const wsUrl = resolveSharedApiUrl();

  return io(`${wsUrl}${namespace}`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    auth: { token },
  });
}

export const wsUrl = configuredWsUrl;
