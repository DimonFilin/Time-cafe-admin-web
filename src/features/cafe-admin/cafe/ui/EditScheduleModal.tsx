'use client';

import { useState, useEffect } from 'react';
import { updateCafeSchedule } from '../api/cafe-api';
import type { Cafe } from '../types/cafe.types';
import { CafeSchedule, DaySchedule } from '../types/cafe.types';
import {
  createDefaultCafeSchedule,
  SCHEDULE_DAYS,
  SCHEDULE_DAY_LABELS,
  type ScheduleDayKey,
} from '../lib/schedule-map';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';

interface EditScheduleModalProps {
  open: boolean;
  cafe: Cafe;
  onClose: () => void;
  onSuccess: () => void;
}

const labelClass = 'mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]';

export function EditScheduleModal({ open, cafe, onClose, onSuccess }: EditScheduleModalProps) {
  const [schedule, setSchedule] = useState<CafeSchedule>(() => createDefaultCafeSchedule());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSchedule(cafe.schedule ? structuredClone(cafe.schedule) : createDefaultCafeSchedule());
  }, [open, cafe]);

  const updateDay = <K extends keyof DaySchedule>(
    day: ScheduleDayKey,
    field: K,
    value: DaySchedule[K],
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const day of SCHEDULE_DAYS) {
      const daySchedule = schedule[day];
      if (!daySchedule.isClosed && daySchedule.open >= daySchedule.close) {
        setError(`${SCHEDULE_DAY_LABELS[day]}: Opening time must be before closing time`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await updateCafeSchedule(schedule);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit cafe schedule"
      onClose={onClose}
      size="md"
      bodyClassName="max-h-[min(70vh,480px)] overflow-y-auto pr-1"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-schedule-form" disabled={loading}>
            {loading ? 'Saving…' : 'Save schedule'}
          </Button>
        </div>
      }
    >
      <form id="edit-schedule-form" onSubmit={handleSubmit} className="space-y-3">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          {SCHEDULE_DAYS.map((day) => (
            <div
              key={day}
              className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[rgb(var(--tc-fg))]">
                  {SCHEDULE_DAY_LABELS[day]}
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[rgb(var(--tc-muted))]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[rgb(var(--tc-border))]"
                    checked={schedule[day].isClosed}
                    onChange={(e) => updateDay(day, 'isClosed', e.target.checked)}
                  />
                  Closed
                </label>
              </div>

              {!schedule[day].isClosed ? (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[120px] flex-1">
                    <label className={labelClass} htmlFor={`${day}-open`}>
                      Open
                    </label>
                    <Input
                      id={`${day}-open`}
                      type="time"
                      value={schedule[day].open}
                      onChange={(e) => updateDay(day, 'open', e.target.value)}
                      required
                    />
                  </div>
                  <span className="hidden pb-2 text-[rgb(var(--tc-muted))] sm:inline">—</span>
                  <div className="min-w-[120px] flex-1">
                    <label className={labelClass} htmlFor={`${day}-close`}>
                      Close
                    </label>
                    <Input
                      id={`${day}-close`}
                      type="time"
                      value={schedule[day].close}
                      onChange={(e) => updateDay(day, 'close', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}
