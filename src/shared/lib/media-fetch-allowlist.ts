import { env } from '@/shared/config/env';

/** host:port в нижнем регистре для сравнения */
function hostPort(u: URL): string {
  const port = u.port || (u.protocol === 'https:' ? '443' : '80');
  return `${u.hostname.toLowerCase()}:${port}`;
}

function tryAddOrigin(out: Set<string>, raw: string) {
  const s = raw.trim();
  if (!s) return;
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  try {
    out.add(hostPort(new URL(withProto)));
  } catch {
    // ignore
  }
}

/**
 * Разрешённые хост:порт для /api/media-fetch (защита от SSRF).
 * По умолчанию: localhost:9000, 127.0.0.1:9000, и тот же hostname что у BACKEND_URL на порту 9000.
 * Дополнительно:
 * - `MEDIA_FETCH_ALLOWED_ORIGINS` (через запятую), например http://192.168.1.10:9000
 * - `NEXT_PUBLIC_BACKEND_FILE_SYSTEM_URL` — тот же публичный MinIO, что в mobile-app (`EXPO_PUBLIC_BACKEND_FILE_SYSTEM_URL`)
 */
export function getMediaFetchAllowedHostPorts(): Set<string> {
  const out = new Set<string>();
  tryAddOrigin(out, 'http://127.0.0.1:9000');
  tryAddOrigin(out, 'http://localhost:9000');
  try {
    const b = new URL(env.backendUrl);
    tryAddOrigin(out, `http://${b.hostname}:9000`);
  } catch {
    // ignore
  }
  const publicFs = process.env.NEXT_PUBLIC_BACKEND_FILE_SYSTEM_URL;
  if (publicFs) {
    tryAddOrigin(out, publicFs);
  }
  const extra = process.env.MEDIA_FETCH_ALLOWED_ORIGINS;
  if (extra) {
    for (const part of extra.split(',')) {
      tryAddOrigin(out, part);
    }
  }
  return out;
}

function isPrivateLanIpv4(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(h);
}

export function isMediaFetchUrlAllowed(target: URL): boolean {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
  if (target.username || target.password) return false;
  if (getMediaFetchAllowedHostPorts().has(hostPort(target))) return true;

  const allowLan =
    process.env.MEDIA_FETCH_ALLOW_PRIVATE_LAN_MINIO === '1' ||
    process.env.MEDIA_FETCH_ALLOW_PRIVATE_LAN_MINIO === 'true';
  const port = target.port || (target.protocol === 'https:' ? '443' : '80');
  if (allowLan && port === '9000' && isPrivateLanIpv4(target.hostname)) return true;

  return false;
}
