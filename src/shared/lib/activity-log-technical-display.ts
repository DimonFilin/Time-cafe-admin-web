export type ActivityLogTechnicalSource = {
  ipAddress?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  method?: string | null;
  statusCode?: number | null;
  duration?: number | null;
};

function isLoopbackIp(ip: string): boolean {
  const t = ip.trim().toLowerCase();
  return (
    t === '::1' ||
    t === '127.0.0.1' ||
    t === 'localhost' ||
    t.startsWith('::ffff:127.') ||
    t === '0:0:0:0:0:0:0:1'
  );
}

/** UA прокси/ингеста (не браузер пользователя). */
function isServerSideUserAgent(ua: string): boolean {
  const s = ua.trim().toLowerCase();
  if (!s) return true;
  if (s === 'node') return true;
  if (s.startsWith('node/')) return true;
  if (s.includes('undici')) return true;
  return false;
}

/** POST создания лога из клиента — на бэке виден только серверный запрос. */
function isActivityLogIngestBeacon(
  endpoint: string | undefined,
  method: string | undefined,
): boolean {
  if (!endpoint || !method) return false;
  if (method.toUpperCase() !== 'POST') return false;
  return endpoint.includes('/activity-logs');
}

export type ActivityLogTechnicalDisplay = {
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
};

/**
 * Возвращает только те поля, которые имеет смысл показывать оператору.
 * Если все отфильтрованы — `null` (секцию в UI не рендерим).
 */
export function getActivityLogTechnicalDisplay(
  log: ActivityLogTechnicalSource,
): ActivityLogTechnicalDisplay | null {
  const out: ActivityLogTechnicalDisplay = {};
  const ingestBeacon = isActivityLogIngestBeacon(
    log.endpoint ?? undefined,
    log.method ?? undefined,
  );

  if (typeof log.statusCode === 'number' && !Number.isNaN(log.statusCode)) {
    out.statusCode = log.statusCode;
  }
  if (typeof log.duration === 'number' && !Number.isNaN(log.duration)) {
    out.duration = log.duration;
  }

  const ip = log.ipAddress?.trim();
  if (ip && !isLoopbackIp(ip)) {
    out.ipAddress = ip;
  }

  const ua = log.userAgent?.trim();
  if (ua && !isServerSideUserAgent(ua)) {
    out.userAgent = ua;
  }

  if (!ingestBeacon) {
    const ep = log.endpoint?.trim();
    if (ep) out.endpoint = ep;
    const m = log.method?.trim();
    if (m) out.method = m;
  }

  if (Object.keys(out).length === 0) return null;
  return out;
}
