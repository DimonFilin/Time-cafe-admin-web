/** Public origin for redirects (Host / X-Forwarded-*), not internal Next bind URL. */
export function resolvePublicOrigin(req: Request): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || req.headers.get('host');
  if (!host) return new URL(req.url).origin;
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
  return `${proto}://${host}`;
}
