export type AppointmentQrPayloadV1 = {
  v: 1;
  t: 'a';
  a: string; // appointment id
  u: string | null; // viewer id (optional)
  c?: string; // cafe id
  n?: string | null; // cafe name (optional)
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type ParsedAppointmentQr =
  | {
      ok: true;
      source: 'json' | 'url' | 'plain';
      raw: string;
      appointmentId: string;
      cafeId: string | null;
      cafeName: string | null;
      payload: AppointmentQrPayloadV1 | null;
    }
  | { ok: false; source: 'json' | 'url' | 'plain' | 'unknown'; raw: string; error: string };

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s ? s : null;
}

export function parseAppointmentQr(raw: string): ParsedAppointmentQr {
  const text = raw.trim();
  if (!text) return { ok: false, source: 'unknown', raw, error: 'Пустой QR-код' };

  // 1) JSON payload (mobile uses JSON.stringify with short keys)
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (isRecord(parsed)) {
        const v = parsed.v;
        const t = parsed.t;
        const a = asTrimmedString(parsed.a);
        const c = asTrimmedString(parsed.c);
        const nRaw = parsed.n;
        const n = nRaw === null ? null : asTrimmedString(nRaw);

        if (v === 1 && t === 'a' && a) {
          const uRaw = parsed.u;
          const u = uRaw === null ? null : asTrimmedString(uRaw);
          const payload: AppointmentQrPayloadV1 = { v: 1, t: 'a', a, u };
          if (c) payload.c = c;
          if (nRaw === null) payload.n = null;
          else if (n) payload.n = n;
          return {
            ok: true,
            source: 'json',
            raw,
            appointmentId: a,
            cafeId: c,
            cafeName: n,
            payload,
          };
        }
      }
      return {
        ok: false,
        source: 'json',
        raw,
        error: 'Не удалось распознать JSON QR-кода бронирования',
      };
    } catch {
      return { ok: false, source: 'json', raw, error: 'QR-код похож на JSON, но не парсится' };
    }
  }

  // 2) URL format (in case later you start encoding links)
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const byParam =
        url.searchParams.get('appointmentId') ||
        url.searchParams.get('id') ||
        url.searchParams.get('a');
      const appointmentId = byParam?.trim() ? byParam.trim() : null;
      const cafeId = (url.searchParams.get('cafeId') || url.searchParams.get('c'))?.trim() || null;
      const cafeName =
        (url.searchParams.get('cafeName') || url.searchParams.get('n'))?.trim() || null;

      if (appointmentId) {
        return { ok: true, source: 'url', raw, appointmentId, cafeId, cafeName, payload: null };
      }

      const m =
        url.pathname.match(/\/appointments\/([^/]+)\/?$/i) ||
        url.pathname.match(/\/appointment\/([^/]+)\/?$/i);
      if (m?.[1]) {
        return {
          ok: true,
          source: 'url',
          raw,
          appointmentId: decodeURIComponent(m[1]),
          cafeId,
          cafeName,
          payload: null,
        };
      }
    } catch {
      // ignore
    }
    return { ok: false, source: 'url', raw, error: 'Не удалось распознать QR-ссылку бронирования' };
  }

  // 3) Plain id (fallback)
  if (text.length >= 1 && text.length <= 128 && !/\s/.test(text)) {
    return {
      ok: true,
      source: 'plain',
      raw,
      appointmentId: text,
      cafeId: null,
      cafeName: null,
      payload: null,
    };
  }

  return { ok: false, source: 'unknown', raw, error: 'Не удалось распознать QR-код бронирования' };
}

export function tryExtractAppointmentIdFromQr(
  raw: string,
): { appointmentId: string } | { error: string } {
  const parsed = parseAppointmentQr(raw);
  if (!parsed.ok) return { error: parsed.error };
  return { appointmentId: parsed.appointmentId };
}
