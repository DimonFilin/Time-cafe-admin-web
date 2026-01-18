import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const url = `${env.backendUrl}/admin/workers${query ? `?${query}` : ''}`;

  return fetchWithAuthRefresh(url, {
    method: 'GET',
    cache: 'no-store',
  });
}

// Register worker (SYSTEM_ADMIN)
export async function POST(req: Request) {
  const bodyText = await req.text();
  const url = `${env.backendUrl}/auth/workers`;

  const response = await fetchWithAuthRefresh(url, {
    method: 'POST',
    body: bodyText,
    cache: 'no-store',
  });

  if (!response.ok) {
    return response;
  }

  // Backend returns tokens for the newly created worker — do not expose them to browser.
  const text = await response.text();
  try {
    const payload = JSON.parse(text) as { user?: unknown };
    return NextResponse.json({ user: payload.user }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Worker created' }, { status: 201 });
  }
}
