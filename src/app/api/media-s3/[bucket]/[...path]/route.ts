import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { refreshAccessToken, setTokenCookies } from '@/shared/lib/refresh-token';

const MAX_KEY_LEN = 4000;

async function fetchFromBackend(url: string, accessToken: string): Promise<Response> {
  const cookieStore = await cookies();
  const accountId = cookieStore.get('tc_account_id')?.value;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (accountId) {
    headers.cookie = `tc_account_id=${accountId}`;
  }
  return fetch(url, { method: 'GET', headers, cache: 'no-store' });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const { bucket, path: pathArray } = await ctx.params;
  const key = pathArray.join('/');
  if (!key || key.length > MAX_KEY_LEN) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const encodedPath = encodeURIComponent(key).replace(/%2F/g, '/');
  const backendUrl = `${env.backendUrl}/media-files/${bucket}/${encodedPath}`;

  const cookieStore = await cookies();
  let access = cookieStore.get('tc_access')?.value;
  let tokensToSet: Awaited<ReturnType<typeof refreshAccessToken>> = null;

  if (!access) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    access = refreshed.accessToken;
    tokensToSet = refreshed;
  }

  let res = await fetchFromBackend(backendUrl, access);
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    access = refreshed.accessToken;
    tokensToSet = refreshed;
    res = await fetchFromBackend(backendUrl, access);
  }

  const body = await res.arrayBuffer();
  const nextRes = new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=60',
    },
  });

  if (tokensToSet) {
    await setTokenCookies(nextRes, tokensToSet);
  }

  return nextRes;
}
