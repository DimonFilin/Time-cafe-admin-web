'use client';

import type { Appointment } from '../types/appointments.types';

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: string) => void;
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
  onViewDetails: (appointment: Appointment) => void;
}

const STATUS_LABELS = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function AppointmentCard({
  appointment,
  onConfirm,
  onCheckIn,
  onCancel,
  onViewDetails,
}: AppointmentCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">
              {appointment.user.firstName} {appointment.user.lastName}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appointment.status]}`}
            >
              {STATUS_LABELS[appointment.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">{appointment.user.email}</p>
          {appointment.user.phone && (
            <p className="text-sm text-[rgb(var(--tc-muted))]">{appointment.user.phone}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mb-3 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[rgb(var(--tc-muted))]">📅 Дата:</span>
          <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[rgb(var(--tc-muted))]">⏱️ Длительность:</span>
          <span className="font-medium">{appointment.duration} мин</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[rgb(var(--tc-muted))]">👥 Гостей:</span>
          <span className="font-medium">{appointment.guestsCount}</span>
        </div>
        {appointment.notes && (
          <div className="flex items-start gap-2">
            <span className="text-[rgb(var(--tc-muted))]">📝 Примечание:</span>
            <span className="font-medium">{appointment.notes}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {appointment.status === 'PENDING' && (
          <button
            onClick={() => onConfirm(appointment.id)}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            ✓ Подтвердить
          </button>
        )}
        {appointment.status === 'CONFIRMED' && (
          <button
            onClick={() => onCheckIn(appointment.id)}
            className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
          >
            ✓ Отметить приход
          </button>
        )}
        {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
          <button
            onClick={() => onCancel(appointment.id)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            ✕ Отменить
          </button>
        )}
        <button
          onClick={() => onViewDetails(appointment)}
          className="rounded-lg border border-[rgb(var(--tc-border))] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[rgb(var(--tc-muted))]/10"
        >
          👁 Детали
        </button>
      </div>

      {/* Cancellation reason */}
      {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
        <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
          <strong>Причина отмены:</strong> {appointment.cancellationReason}
        </div>
      )}
    </div>
  );
}
