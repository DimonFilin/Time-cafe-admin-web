import { NextRequest, NextResponse } from 'next/server';

import { isMediaFetchUrlAllowed } from '@/shared/lib/media-fetch-allowlist';

const MAX_PARAM_LEN = 12_000;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw || raw.length > MAX_PARAM_LEN) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (!isMediaFetchUrlAllowed(target)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let upstream: Response;
  try {
    const controller = new AbortController();
    const kill = setTimeout(() => controller.abort(), 25_000);
    try {
      upstream = await fetch(raw, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(kill);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isAbort = e instanceof Error && e.name === 'AbortError';
    return NextResponse.json(
      {
        error: 'MEDIA_FETCH_UPSTREAM_FAILED',
        message: isAbort
          ? 'Таймаут подключения к MinIO (сервер Next не достучался до URL). Для картинок по умолчанию используйте прямой URL в браузере (без NEXT_PUBLIC_MEDIA_FETCH_PROXY).'
          : msg,
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return new NextResponse(upstream.statusText || 'Upstream error', {
      status: upstream.status,
    });
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const cacheControl = 'private, max-age=120';

  if (!upstream.body) {
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  });
}
