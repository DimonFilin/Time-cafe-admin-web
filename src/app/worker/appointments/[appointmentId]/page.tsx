'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';

import { appointmentsApi } from '@/features/worker/appointments/api/appointments-api';
import { CancelAppointmentModal } from '@/features/worker/appointments/ui/CancelAppointmentModal';
import type { Appointment } from '@/features/worker/appointments/types/appointments.types';
import {
  getAppointmentCustomerEmail,
  getAppointmentCustomerName,
  getAppointmentCustomerPhone,
  getAppointmentDateTime,
  normalizeAppointmentStatus,
} from '@/features/worker/appointments/lib/appointmentView';
import { workerApi } from '@/features/worker/api/worker-api';
import { Button } from '@/shared/ui/button/Button';
import { AppShell } from '@/widgets/layout/AppShell';

const STATUS_LABELS: Record<Appointment['status'], string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждено',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WorkerAppointmentDetailsPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const router = useRouter();
  const { appointmentId: appointmentIdParam } = use(params);
  const appointmentId = decodeURIComponent(appointmentIdParam);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'confirm' | 'checkin' | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const me = await workerApi.getMe();
      if (!me.cafeId) {
        setCafeId(null);
        setAppointment(null);
        setError('Работник не привязан к кафе');
        return;
      }
      setCafeId(me.cafeId);

      const a = await appointmentsApi.getAppointmentById(appointmentId, me.cafeId);
      setAppointment(a);
    } catch (e) {
      console.error('[WorkerAppointmentDetailsPage] load failed:', e);
      setError('Не удалось загрузить бронирование');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const normalizedStatus = useMemo(
    () => (appointment ? normalizeAppointmentStatus(appointment.status) : null),
    [appointment],
  );

  const canConfirm = normalizedStatus === 'PENDING';
  const canCheckIn = normalizedStatus === 'CONFIRMED';
  const canCancel = normalizedStatus === 'PENDING' || normalizedStatus === 'CONFIRMED';

  const appointmentInfo = useMemo(() => {
    if (!appointment) return '';
    const dt = getAppointmentDateTime(appointment);
    const base = getAppointmentCustomerName(appointment);
    return `${base}${dt ? ` • ${formatDateTime(dt)}` : ''}`;
  }, [appointment]);

  const customerName = useMemo(
    () => (appointment ? getAppointmentCustomerName(appointment) : ''),
    [appointment],
  );
  const customerEmail = useMemo(
    () => (appointment ? getAppointmentCustomerEmail(appointment) : null),
    [appointment],
  );
  const customerPhone = useMemo(
    () => (appointment ? getAppointmentCustomerPhone(appointment) : null),
    [appointment],
  );
  const appointmentDateTime = useMemo(
    () => (appointment ? getAppointmentDateTime(appointment) : null),
    [appointment],
  );

  const handleConfirm = async () => {
    if (!cafeId || !appointment) return;
    try {
      setActionLoading('confirm');
      await appointmentsApi.confirmAppointment({ appointmentId: appointment.id, cafeId });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async () => {
    if (!cafeId || !appointment) return;
    try {
      setActionLoading('checkin');
      await appointmentsApi.checkInAppointment({ appointmentId: appointment.id, cafeId });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!cafeId || !appointment) return;
    try {
      await appointmentsApi.cancelAppointment({ appointmentId: appointment.id, cafeId, reason });
      setCancelOpen(false);
      await load();
    } catch (e) {
      console.error('[WorkerAppointmentDetailsPage] cancel failed:', e);
      alert('Не удалось отменить бронирование');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              ← Назад
            </Button>
            <Link
              href="/worker"
              className="text-sm text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]"
            >
              К спискам
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canConfirm && (
              <Button onClick={handleConfirm} disabled={actionLoading !== null}>
                {actionLoading === 'confirm' ? '...' : '✓ Подтвердить'}
              </Button>
            )}
            {canCheckIn && (
              <Button onClick={handleCheckIn} disabled={actionLoading !== null}>
                {actionLoading === 'checkin' ? '...' : '✓ Отметить приход'}
              </Button>
            )}
            {canCancel && (
              <Button
                onClick={() => setCancelOpen(true)}
                className="bg-[rgb(var(--tc-danger))] hover:bg-[rgb(var(--tc-danger))]/90"
              >
                ✕ Отменить
              </Button>
            )}
            <Button variant="secondary" onClick={load} disabled={loading}>
              🔄 Обновить
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-8 text-center">
            Загрузка бронирования...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : appointment ? (
          <div className="rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[rgb(var(--tc-muted))]">ID</div>
                <div className="font-mono text-sm">{appointment.id}</div>
                <div className="mt-3 text-xl font-semibold">{customerName}</div>
                {customerEmail ? (
                  <div className="text-sm text-[rgb(var(--tc-muted))]">{customerEmail}</div>
                ) : null}
                {customerPhone ? (
                  <div className="text-sm text-[rgb(var(--tc-muted))]">{customerPhone}</div>
                ) : null}
              </div>

              <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-4 py-3">
                <div className="text-xs text-[rgb(var(--tc-muted))]">Статус</div>
                <div className="text-base font-semibold">
                  {normalizedStatus ? STATUS_LABELS[normalizedStatus] : 'Неизвестно'}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4">
                <div className="text-xs text-[rgb(var(--tc-muted))]">Дата и время</div>
                <div className="mt-1 font-medium">
                  {appointmentDateTime ? formatDateTime(appointmentDateTime) : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4">
                <div className="text-xs text-[rgb(var(--tc-muted))]">Длительность</div>
                <div className="mt-1 font-medium">{appointment.duration} минут</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4">
                <div className="text-xs text-[rgb(var(--tc-muted))]">Гостей</div>
                <div className="mt-1 font-medium">{appointment.guestsCount ?? '—'}</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4">
                <div className="text-xs text-[rgb(var(--tc-muted))]">Создано</div>
                <div className="mt-1 font-medium">{formatDateTime(appointment.createdAt)}</div>
              </div>
            </div>

            {appointment.notes ? (
              <div className="mt-6">
                <div className="text-sm font-medium">Примечания</div>
                <div className="mt-2 rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4 text-sm">
                  {appointment.notes}
                </div>
              </div>
            ) : null}

            {normalizedStatus === 'CANCELLED' && appointment.cancellationReason ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="font-medium">Причина отмены</div>
                <div className="mt-1">{appointment.cancellationReason}</div>
              </div>
            ) : null}

            {appointment.qrCode ? (
              <div className="mt-6">
                <div className="text-sm font-medium">QR (сырой текст)</div>
                <div className="mt-2 rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4 font-mono text-xs">
                  {appointment.qrCode}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <CancelAppointmentModal
          isOpen={cancelOpen}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
          appointmentInfo={appointmentInfo}
        />
      </div>
    </AppShell>
  );
}
