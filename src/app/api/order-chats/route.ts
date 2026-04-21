import { NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(req: NextRequest) {
  const url = new URL(`${env.backendUrl}/order-chats`);
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetchWithAuthRefresh(url.toString(), { method: 'GET' });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
  });
}
