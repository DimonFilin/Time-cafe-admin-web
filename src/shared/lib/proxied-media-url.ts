import { tryParseMinioPathStyleUrl } from '@/shared/lib/minio-public-url';

/**
 * URL для <img> / ссылок на медиа из MinIO.
 *
 * 1) Если URL — path-style MinIO (`/cafes/...`, `/users/...`) — same-origin **`/api/media-s3/...`**:
 *    браузер → Next (localhost) → Nest → MinIO по **внутреннему** STORAGE_ENDPOINT (без presigned, без блокировки
 *    Chrome «localhost → частная сеть» и без таймаута Next → LAN :9000).
 * 2) Иначе при `NEXT_PUBLIC_MEDIA_FETCH_PROXY=true` — `/api/media-fetch?url=...` (редкий случай).
 * 3) Иначе — прямой URL (мобилка / внешние CDN).
 */
export function proxiedMediaUrl(url: string | null | undefined): string | undefined {
  const raw = String(url ?? '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  try {
    new URL(raw);
  } catch {
    return raw;
  }

  const minio = tryParseMinioPathStyleUrl(raw);
  if (minio) {
    const encPath = encodeURIComponent(minio.key).replace(/%2F/g, '/');
    return `/api/media-s3/${minio.bucket}/${encPath}`;
  }

  const useLegacyFetchProxy =
    process.env.NEXT_PUBLIC_MEDIA_FETCH_PROXY === '1' ||
    process.env.NEXT_PUBLIC_MEDIA_FETCH_PROXY === 'true';
  if (useLegacyFetchProxy) {
    return `/api/media-fetch?url=${encodeURIComponent(raw)}`;
  }

  return raw;
}
