import { NextRequest } from 'next/server';
import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh, type AuthFetchOptions } from '@/shared/lib/with-auth-refresh';

async function forward(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = new URL(`${env.backendUrl}/order-chats/${path}`);
  const incoming = new URL(req.url);
  incoming.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const contentType = req.headers.get('content-type') || '';
  const init: AuthFetchOptions = { method: req.method };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (contentType.includes('multipart/form-data')) {
      // Не пересобирать FormData в Node — граница/файлы часто ломаются; проксируем сырое тело.
      init.body = await req.arrayBuffer();
      init.headers = { 'Content-Type': contentType };
    } else {
      init.body = await req.text();
      init.headers = { 'Content-Type': contentType || 'application/json' };
    }
  }

  return fetchWithAuthRefresh(url.toString(), init);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
