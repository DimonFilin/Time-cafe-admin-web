'use client';

import { useState, useEffect } from 'react';
import { appointmentsApi } from '../api/appointments-api';
import type { Appointment } from '../types/appointments.types';
import { AppointmentCard } from './AppointmentCard';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';

interface AppointmentsTabProps {
  cafeId: string;
}

export function AppointmentsTab({ cafeId }: AppointmentsTabProps) {
  const [filter, setFilter] = useState<'active' | 'history'>('active');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    if (!cafeId) {
      console.error('[AppointmentsTab] cafeId is missing');
      setError('Не удалось определить кафе работника');
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
        if (filter === 'active') {
          return appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
        } else {
          return appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED';
        }
      });

      setAppointments(filtered);
    } catch (err) {
      console.error('[AppointmentsTab] Failed to fetch appointments:', err);
      setError('Не удалось загрузить бронирования');
      setAppointments([]); // Очищаем список при ошибке
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh every 30 seconds for active appointments
    if (filter === 'active' && cafeId) {
      const interval = setInterval(fetchAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [cafeId, filter]);

  const handleConfirm = async (appointmentId: string) => {
    try {
      await appointmentsApi.confirmAppointment({ appointmentId, cafeId });
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
      alert('Не удалось подтвердить бронирование');
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await appointmentsApi.checkInAppointment({ appointmentId, cafeId });
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to check-in appointment:', err);
      alert('Не удалось отметить приход');
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
      alert('Не удалось отменить бронирование');
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Бронирования</h2>
          <p className="text-sm text-[rgb(var(--tc-muted))]">Управление бронированиями столов</p>
        </div>
        <button
          onClick={fetchAppointments}
          className="rounded-lg border border-[rgb(var(--tc-border))] px-4 py-2 text-sm transition-colors hover:bg-[rgb(var(--tc-muted))]/10"
        >
          🔄 Обновить
        </button>
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
          Активные {filter === 'active' && appointments.length > 0 && `(${appointments.length})`}
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'history'
              ? 'border-b-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
              : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
          }`}
        >
          История
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="text-lg">Загрузка бронирований...</div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-lg text-red-700">{error}</div>
          <button
            onClick={fetchAppointments}
            className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200"
          >
            Попробовать снова
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-8 text-center">
          <div className="mb-4 text-4xl">📅</div>
          <h3 className="mb-2 text-lg font-medium">Нет бронирований</h3>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {filter === 'active' ? 'Активных бронирований пока нет' : 'История бронирований пуста'}
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
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        appointmentInfo={
          appointmentToCancel
            ? `${appointmentToCancel.user.firstName} ${appointmentToCancel.user.lastName}`
            : ''
        }
      />
    </div>
  );
}
