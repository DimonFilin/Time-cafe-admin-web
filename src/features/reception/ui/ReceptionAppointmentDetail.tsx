'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/Card';
import { appointmentsApi } from '@/features/worker/appointments/api/appointments-api';
import type { ReceptionAppointment } from '../api/reception-api';

type Props = {
  cafeId: string;
  appointment: ReceptionAppointment;
  onUpdated: () => void | Promise<void>;
};

function normStatus(s: string) {
  return s.toLowerCase();
}

export function ReceptionAppointmentDetail({ cafeId, appointment, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);
  const status = normStatus(appointment.status);
  const isPending = status === 'pending';
  const isConfirmed = status === 'confirmed';
  const isTerminal = status === 'cancelled' || status === 'completed' || status === 'checked_in';

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onUpdated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold">Бронь на сегодня</h3>
      <p className="text-sm text-[rgb(var(--tc-muted))]">
        {new Date(appointment.dateTime).toLocaleString('ru-RU')} · {appointment.duration} мин
        {appointment.room?.name ? ` · ${appointment.room.name}` : ''}
      </p>
      <p className="text-sm font-medium">Статус: {appointment.status}</p>
      {appointment.notes ? (
        <p className="text-sm text-[rgb(var(--tc-muted))]">{appointment.notes}</p>
      ) : null}
      {!isTerminal && (
        <div className="flex flex-wrap gap-2">
          {isPending && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  appointmentsApi.confirmAppointment({ appointmentId: appointment.id, cafeId }),
                )
              }
            >
              Подтвердить
            </Button>
          )}
          {isConfirmed && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  appointmentsApi.checkInAppointment({ appointmentId: appointment.id, cafeId }),
                )
              }
            >
              Check-in
            </Button>
          )}
          {(isPending || isConfirmed) && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                const reason = window.prompt('Причина отмены')?.trim();
                if (!reason) return;
                void run(() =>
                  appointmentsApi.cancelAppointment({
                    appointmentId: appointment.id,
                    cafeId,
                    reason,
                  }),
                );
              }}
            >
              Отменить
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
