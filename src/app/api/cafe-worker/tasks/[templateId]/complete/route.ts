import { NextRequest } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await context.params;
  const body = await request.json();

  return fetchWithAuthRefresh(`${env.backendUrl}/cafe-worker/tasks/${templateId}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return new Response(JSON.stringify({ message: 'Date parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(`${env.backendUrl}/cafe-worker/tasks/${templateId}/complete`);
  url.searchParams.append('date', date);

  return fetchWithAuthRefresh(url.toString(), {
    method: 'DELETE',
    cache: 'no-store',
  });
}
