/** Имена бакетов MinIO (path-style URL: /bucket/key...) */
const KNOWN_BUCKETS = new Set(['cafes', 'users', 'brands', 'public']);

/**
 * Разбор публичного path-style URL MinIO: `http(s)://host:port/bucket/key...`
 * (в т.ч. presigned — путь без query).
 */
export function tryParseMinioPathStyleUrl(raw: string): { bucket: string; key: string } | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.username || u.password) return null;
  const segs = u.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
  if (segs.length < 2) return null;
  const bucket = segs[0];
  if (!KNOWN_BUCKETS.has(bucket)) return null;
  return { bucket, key: segs.slice(1).join('/') };
}
