'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

type DayKey = (typeof DAYS)[number];

type Seg = { open: string; close: string };

type DayDraft = { closed: boolean; segments: Seg[] };

type Draft = Record<DayKey, DayDraft>;

function emptyDraft(): Draft {
  const d = {} as Draft;
  for (const day of DAYS) {
    d[day] = { closed: false, segments: [{ open: '09:00', close: '18:00' }] };
  }
  return d;
}

function parseApiToDraft(raw: unknown): Draft {
  const base = emptyDraft();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  for (const day of DAYS) {
    const v = o[day];
    if (!v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    if (r.closed === true) {
      base[day] = { closed: true, segments: [] };
      continue;
    }
    if (Array.isArray(r.segments)) {
      const segs: Seg[] = [];
      for (const s of r.segments) {
        if (s && typeof s === 'object') {
          const z = s as Record<string, unknown>;
          if (typeof z.open === 'string' && typeof z.close === 'string') {
            segs.push({ open: z.open, close: z.close });
          }
        }
      }
      base[day] = {
        closed: false,
        segments: segs.length ? segs : [{ open: '09:00', close: '18:00' }],
      };
      continue;
    }
    if (typeof r.open === 'string' && typeof r.close === 'string') {
      base[day] = { closed: false, segments: [{ open: r.open, close: r.close }] };
    }
  }
  return base;
}

function draftToPutBody(d: Draft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const day of DAYS) {
    const st = d[day];
    if (st.closed) out[day] = { closed: true };
    else out[day] = { segments: st.segments };
  }
  return out;
}

export function WorkerShiftSchedulePanel({
  workerId,
  onSaved,
}: {
  workerId: string;
  onSaved?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [absences, setAbsences] = useState<
    { id: string; startDate: string; endDate: string; kind: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAbs, setNewAbs] = useState({ startYmd: '', endYmd: '', kind: 'VACATION' as string });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schRes, absRes] = await Promise.all([
        fetch(`/api/cafe-admin/workers/${workerId}/shift-schedule`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/cafe-admin/workers/${workerId}/schedule-absences`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);
      if (!schRes.ok) throw new Error('schedule');
      const sch = await schRes.json();
      setDraft(parseApiToDraft(sch.shiftSchedule));
      if (absRes.ok) {
        const list = await absRes.json();
        setAbsences(Array.isArray(list) ? list : []);
      }
    } catch {
      setError(t('workers.shiftSchedule.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (force?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const body = draftToPutBody(draft);
      const res = await fetch(`/api/cafe-admin/workers/${workerId}/shift-schedule`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.message === 'string' ? data.message : 'save');
      }
      const violations = data.cafeBoundsViolations as
        | { day: string; segment: string }[]
        | undefined;
      if (violations?.length && !force) {
        const ok = window.confirm(t('workers.shiftSchedule.outsideCafeConfirm'));
        if (!ok) {
          setSaving(false);
          return;
        }
        await save(true);
        return;
      }
      onSaved?.();
    } catch {
      setError(t('workers.shiftSchedule.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addAbsence = async () => {
    if (!newAbs.startYmd || !newAbs.endYmd) return;
    const res = await fetch(`/api/cafe-admin/workers/${workerId}/schedule-absences`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startYmd: newAbs.startYmd,
        endYmd: newAbs.endYmd,
        kind: newAbs.kind,
      }),
    });
    if (!res.ok) {
      setError(t('workers.shiftSchedule.absenceFailed'));
      return;
    }
    setNewAbs({ startYmd: '', endYmd: '', kind: 'VACATION' });
    void load();
  };

  const removeAbsence = async (id: string) => {
    await fetch(`/api/cafe-admin/workers/${workerId}/schedule-absences/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    void load();
  };

  if (loading) {
    return <p className="text-sm text-[rgb(var(--tc-muted))]">{t('common.loading')}</p>;
  }

  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-[rgb(var(--tc-muted))]">{t('workers.shiftSchedule.hint')}</p>
      {DAYS.map((day) => (
        <div
          key={day}
          className="space-y-2 rounded-lg border border-[rgb(var(--tc-border))] p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{t(`workers.shiftSchedule.days.${day}`)}</span>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={draft[day].closed}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [day]: {
                      ...d[day],
                      closed: e.target.checked,
                      segments: e.target.checked ? [] : [{ open: '09:00', close: '18:00' }],
                    },
                  }))
                }
              />
              {t('workers.shiftSchedule.dayOff')}
            </label>
          </div>
          {!draft[day].closed && (
            <>
              {draft[day].segments.map((seg, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-24 rounded border border-[rgb(var(--tc-border))] px-2 py-1"
                    value={seg.open}
                    onChange={(e) => {
                      const segs = [...draft[day].segments];
                      segs[idx] = { ...segs[idx], open: e.target.value };
                      setDraft((d) => ({ ...d, [day]: { ...d[day], segments: segs } }));
                    }}
                  />
                  <span>—</span>
                  <input
                    className="w-24 rounded border border-[rgb(var(--tc-border))] px-2 py-1"
                    value={seg.close}
                    onChange={(e) => {
                      const segs = [...draft[day].segments];
                      segs[idx] = { ...segs[idx], close: e.target.value };
                      setDraft((d) => ({ ...d, [day]: { ...d[day], segments: segs } }));
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => {
                      const segs = draft[day].segments.filter((_, j) => j !== idx);
                      setDraft((d) => ({
                        ...d,
                        [day]: {
                          ...d[day],
                          segments: segs.length ? segs : [{ open: '09:00', close: '18:00' }],
                        },
                      }));
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-[rgb(var(--tc-accent))]"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    [day]: {
                      ...d[day],
                      segments: [...d[day].segments, { open: '14:00', close: '18:00' }],
                    },
                  }))
                }
              >
                + {t('workers.shiftSchedule.addSegment')}
              </button>
            </>
          )}
        </div>
      ))}
      <Button type="button" variant="primary" disabled={saving} onClick={() => void save()}>
        {saving ? t('common.saving') : t('workers.shiftSchedule.save')}
      </Button>

      <div className="space-y-2 border-t border-[rgb(var(--tc-border))] pt-4">
        <h4 className="text-sm font-semibold">{t('workers.shiftSchedule.absences')}</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <input
            type="date"
            className="rounded border border-[rgb(var(--tc-border))] px-2 py-1"
            value={newAbs.startYmd}
            onChange={(e) => setNewAbs((a) => ({ ...a, startYmd: e.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-[rgb(var(--tc-border))] px-2 py-1"
            value={newAbs.endYmd}
            onChange={(e) => setNewAbs((a) => ({ ...a, endYmd: e.target.value }))}
          />
          <select
            className="rounded border border-[rgb(var(--tc-border))] px-2 py-1"
            value={newAbs.kind}
            onChange={(e) => setNewAbs((a) => ({ ...a, kind: e.target.value }))}
          >
            <option value="VACATION">{t('workers.shiftSchedule.vacation')}</option>
            <option value="SICK_LEAVE">{t('workers.shiftSchedule.sick')}</option>
          </select>
          <Button type="button" variant="secondary" onClick={() => void addAbsence()}>
            {t('workers.shiftSchedule.addAbsence')}
          </Button>
        </div>
        <ul className="space-y-1 text-xs">
          {absences.map((a) => (
            <li key={a.id} className="flex justify-between gap-2">
              <span>
                {String(a.startDate).slice(0, 10)} — {String(a.endDate).slice(0, 10)} ({a.kind})
              </span>
              <button
                type="button"
                className="text-red-600"
                onClick={() => void removeAbsence(a.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
