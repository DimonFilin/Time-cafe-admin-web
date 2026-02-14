'use client';

import { useState } from 'react';
import { updateCafeSchedule } from '../api/cafe-api';
import { CafeSchedule, DaySchedule } from '../types/cafe.types';

interface EditScheduleModalProps {
  cafeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_DAY: DaySchedule = {
  open: '09:00',
  close: '18:00',
  isClosed: false,
};

export function EditScheduleModal({ onClose, onSuccess }: EditScheduleModalProps) {
  const [schedule, setSchedule] = useState<CafeSchedule>({
    monday: { ...DEFAULT_DAY },
    tuesday: { ...DEFAULT_DAY },
    wednesday: { ...DEFAULT_DAY },
    thursday: { ...DEFAULT_DAY },
    friday: { ...DEFAULT_DAY },
    saturday: { ...DEFAULT_DAY },
    sunday: { ...DEFAULT_DAY, isClosed: true },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDay = <K extends keyof DaySchedule>(
    day: (typeof DAYS)[number],
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

    // Validate times
    for (const day of DAYS) {
      const daySchedule = schedule[day];
      if (!daySchedule.isClosed && daySchedule.open >= daySchedule.close) {
        setError(`${DAY_LABELS[day]}: Opening time must be before closing time`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await updateCafeSchedule({ schedule });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Cafe Schedule</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            <div className="schedule-list">
              {DAYS.map((day) => (
                <div key={day} className="schedule-day">
                  <div className="day-header">
                    <label className="day-label">{DAY_LABELS[day]}</label>
                    <label className="closed-checkbox">
                      <input
                        type="checkbox"
                        checked={schedule[day].isClosed}
                        onChange={(e) => updateDay(day, 'isClosed', e.target.checked)}
                      />
                      <span>Closed</span>
                    </label>
                  </div>

                  {!schedule[day].isClosed && (
                    <div className="time-inputs">
                      <div className="time-group">
                        <label>Open</label>
                        <input
                          type="time"
                          value={schedule[day].open}
                          onChange={(e) => updateDay(day, 'open', e.target.value)}
                          required
                        />
                      </div>
                      <span className="time-separator">—</span>
                      <div className="time-group">
                        <label>Close</label>
                        <input
                          type="time"
                          value={schedule[day].close}
                          onChange={(e) => updateDay(day, 'close', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--tc-spacing-4);
        }

        .modal-content {
          background: var(--tc-bg-primary);
          border-radius: var(--tc-radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--tc-spacing-5);
          border-bottom: 1px solid var(--tc-border-primary);
        }

        .modal-header h2 {
          font-size: var(--tc-font-size-xl);
          font-weight: var(--tc-font-weight-semibold);
          color: var(--tc-text-primary);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 28px;
          color: var(--tc-text-secondary);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--tc-radius-md);
          transition: all 0.2s;
        }

        .close-button:hover {
          background: var(--tc-bg-hover);
          color: var(--tc-text-primary);
        }

        .modal-body {
          padding: var(--tc-spacing-5);
          overflow-y: auto;
          flex: 1;
        }

        .error-banner {
          background: var(--tc-error-bg);
          color: var(--tc-error-text);
          padding: var(--tc-spacing-3);
          border-radius: var(--tc-radius-md);
          margin-bottom: var(--tc-spacing-4);
          font-size: var(--tc-font-size-sm);
        }

        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: var(--tc-spacing-4);
        }

        .schedule-day {
          background: var(--tc-bg-secondary);
          border: 1px solid var(--tc-border-primary);
          border-radius: var(--tc-radius-md);
          padding: var(--tc-spacing-4);
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tc-spacing-3);
        }

        .day-label {
          font-size: var(--tc-font-size-base);
          font-weight: var(--tc-font-weight-semibold);
          color: var(--tc-text-primary);
        }

        .closed-checkbox {
          display: flex;
          align-items: center;
          gap: var(--tc-spacing-2);
          font-size: var(--tc-font-size-sm);
          color: var(--tc-text-secondary);
          cursor: pointer;
        }

        .closed-checkbox input[type='checkbox'] {
          cursor: pointer;
        }

        .time-inputs {
          display: flex;
          align-items: center;
          gap: var(--tc-spacing-3);
        }

        .time-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--tc-spacing-1);
        }

        .time-group label {
          font-size: var(--tc-font-size-xs);
          font-weight: var(--tc-font-weight-medium);
          color: var(--tc-text-secondary);
        }

        .time-group input[type='time'] {
          width: 100%;
          padding: var(--tc-spacing-2) var(--tc-spacing-3);
          border: 1px solid var(--tc-border-primary);
          border-radius: var(--tc-radius-md);
          font-size: var(--tc-font-size-base);
          color: var(--tc-text-primary);
          background: var(--tc-bg-primary);
          transition: all 0.2s;
        }

        .time-group input[type='time']:focus {
          outline: none;
          border-color: var(--tc-primary);
          box-shadow: 0 0 0 3px var(--tc-primary-light);
        }

        .time-separator {
          color: var(--tc-text-secondary);
          margin-top: 20px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--tc-spacing-3);
          padding: var(--tc-spacing-5);
          border-top: 1px solid var(--tc-border-primary);
        }

        .btn-cancel,
        .btn-submit {
          padding: var(--tc-spacing-2) var(--tc-spacing-4);
          border-radius: var(--tc-radius-md);
          font-size: var(--tc-font-size-sm);
          font-weight: var(--tc-font-weight-medium);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-cancel {
          background: var(--tc-bg-tertiary);
          color: var(--tc-text-primary);
          border: 1px solid var(--tc-border-primary);
        }

        .btn-cancel:hover:not(:disabled) {
          background: var(--tc-bg-hover);
        }

        .btn-submit {
          background: var(--tc-primary);
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: var(--tc-primary-hover);
        }

        .btn-cancel:disabled,
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
