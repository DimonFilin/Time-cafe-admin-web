'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/i18n';
import { appointmentsApi } from '../api/appointments-api';
import type { Appointment } from '../types/appointments.types';
import { AppointmentCard } from './AppointmentCard';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { QrScanModal } from '@/shared/ui/qr/QrScanModal';
import { parseAppointmentQr } from '@/shared/lib/appointment-qr';
import {
  getAppointmentCustomerName,
  getAppointmentDateTime,
  normalizeAppointmentStatus,
} from '../lib/appointmentView';

interface AppointmentsTabProps {
  cafeId: string;
}

export function AppointmentsTab({ cafeId }: AppointmentsTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'active' | 'history'>('active');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!cafeId) {
      console.error('[AppointmentsTab] cafeId is missing');
      setError(t('appointments.errors.fetchFailed'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Получаем все бронирования
      const response =
        filter === 'active'
          ? await appointmentsApi.getActiveAppointments(cafeId)
          : await appointmentsApi.getAppointmentsHistory(cafeId);

      console.log('[AppointmentsTab] Response:', response);

      // Проверяем что response.items существует и это массив
      if (!response || !Array.isArray(response.items)) {
        console.error('[AppointmentsTab] Invalid response format:', response);
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Фильтруем на фронте
      const filtered = response.items.filter((appointment) => {
        const s = normalizeAppointmentStatus(appointment.status);
        if (filter === 'active') {
          return s === 'PENDING' || s === 'CONFIRMED';
        } else {
          return s === 'COMPLETED' || s === 'CANCELLED';
        }
      });

      setAppointments(filtered);
    } catch (err) {
      console.error('[AppointmentsTab] Failed to fetch appointments:', err);
      setError(t('appointments.errors.fetchFailed'));
      setAppointments([]); // Очищаем список при ошибке
    } finally {
      setLoading(false);
    }
  }, [cafeId, filter]);

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh every 30 seconds for active appointments
    if (filter === 'active' && cafeId) {
      const interval = setInterval(fetchAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [cafeId, fetchAppointments, filter]);

  const handleConfirm = async (appointmentId: string) => {
    try {
      await appointmentsApi.confirmAppointment({ appointmentId, cafeId });
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
      alert(t('appointments.errors.confirmFailed'));
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await appointmentsApi.checkInAppointment({ appointmentId, cafeId });
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to check-in appointment:', err);
      alert(t('appointments.errors.checkInFailed'));
    }
  };

  const handleCancelClick = (appointmentId: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (appointment) {
      setAppointmentToCancel(appointment);
      setIsCancelModalOpen(true);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!appointmentToCancel) return;

    try {
      await appointmentsApi.cancelAppointment({
        appointmentId: appointmentToCancel.id,
        cafeId,
        reason,
      });
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert(t('appointments.errors.cancelFailed'));
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    router.push(`/worker/appointments/${encodeURIComponent(appointment.id)}`);
  };

  const handleQrDetected = (raw: string) => {
    const parsed = parseAppointmentQr(raw);
    if (!parsed.ok) {
      setQrError(parsed.error);
      return;
    }

    if (parsed.cafeId && parsed.cafeId !== cafeId) {
      const other = parsed.cafeName ? `${parsed.cafeName} (${parsed.cafeId})` : parsed.cafeId;
      setQrError(`Этот QR-код относится к другому кафе: ${other}. Текущее кафе: ${cafeId}.`);
      return;
    }

    setQrError(null);
    setIsQrOpen(false);
    router.push(`/worker/appointments/${encodeURIComponent(parsed.appointmentId)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('appointments.title')}</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">{t('appointments.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setQrError(null);
              setIsQrOpen(true);
            }}
            className="rounded-lg border border-[rgb(var(--tc-border))] px-4 py-2 text-sm transition-colors hover:bg-[rgb(var(--tc-muted))]/10"
            title={t('appointments.scanQr')}
          >
            📷 QR
          </button>
          <button
            onClick={fetchAppointments}
            className="rounded-lg border border-[rgb(var(--tc-border))] px-4 py-2 text-sm transition-colors hover:bg-[rgb(var(--tc-muted))]/10"
          >
            🔄 {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-[rgb(var(--tc-border))]">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'border-b-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
              : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
          }`}
        >
          {t('appointments.active')}{' '}
          {filter === 'active' && appointments.length > 0 && `(${appointments.length})`}
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'history'
              ? 'border-b-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
              : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
          }`}
        >
          {t('appointments.history')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="text-lg">{t('worker.appointments.loading')}</div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-lg text-red-700">{error}</div>
          <button
            onClick={fetchAppointments}
            className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="mb-4 text-4xl">📅</div>
          <h3 className="mb-2 text-lg font-medium">{t('appointments.noAppointments')}</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {filter === 'active'
              ? t('appointments.noActiveAppointments')
              : t('appointments.noHistoryAppointments')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={handleConfirm}
              onCheckIn={handleCheckIn}
              onCancel={handleCancelClick}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        appointmentInfo={
          appointmentToCancel
            ? `${getAppointmentCustomerName(appointmentToCancel)}${(() => {
                const dt = getAppointmentDateTime(appointmentToCancel);
                return dt ? ` • ${new Date(dt).toLocaleString('ru-RU')}` : '';
              })()}`
            : ''
        }
      />

      <QrScanModal
        open={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        errorText={qrError}
        onDetected={handleQrDetected}
      />
    </div>
  );
}
