/** Secure cookies require HTTPS. On HTTP demo servers set COOKIE_SECURE=false. */
export function isAuthCookieSecure(): boolean {
  return process.env.COOKIE_SECURE === 'true';
}
