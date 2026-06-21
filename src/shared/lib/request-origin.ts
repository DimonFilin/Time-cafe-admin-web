const configuredPublicUrl = () =>
  (process.env.PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, '');

/** Public origin for redirects (env / Referer / Host), not internal Next bind URL. */
export function resolvePublicOrigin(req: Request): string {
  const fromEnv = configuredPublicUrl();
  if (fromEnv) return fromEnv;

  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }

  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
    return `${proto}://${host}`;
  }

  return new URL(req.url).origin;
}

export function resolveLoginUrl(req: Request): URL {
  return new URL('/login', resolvePublicOrigin(req));
}
