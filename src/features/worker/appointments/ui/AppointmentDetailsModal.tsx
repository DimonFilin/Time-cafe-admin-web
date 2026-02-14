'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import type { Appointment } from '../types/appointments.types';
import {
  getAppointmentCustomerEmail,
  getAppointmentCustomerName,
  getAppointmentCustomerPhone,
  getAppointmentDateTime,
  normalizeAppointmentStatus,
} from '../lib/appointmentView';

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
};

export function AppointmentDetailsModal({
  appointment,
  isOpen,
  onClose,
}: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const status = normalizeAppointmentStatus(appointment.status) ?? 'PENDING';
  const dateTime = getAppointmentDateTime(appointment);
  const customerName = getAppointmentCustomerName(appointment);
  const customerEmail = getAppointmentCustomerEmail(appointment);
  const customerPhone = getAppointmentCustomerPhone(appointment);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Детали бронирования">
      <div className="space-y-6">
        {/* Status */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Статус</h3>
          <p className="mt-1 text-lg font-semibold">{STATUS_LABELS[status]}</p>
        </div>

        {/* Customer */}
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Клиент</h3>
          <p className="mt-1">{customerName}</p>
          {customerEmail ? (
            <p className="text-sm text-[rgb(var(--tc-muted))]">{customerEmail}</p>
          ) : null}
          {customerPhone ? (
            <p className="text-sm text-[rgb(var(--tc-muted))]">{customerPhone}</p>
          ) : null}
        </div>

        {/* Appointment info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Дата и время</h3>
            <p className="mt-1">{dateTime ? formatDate(dateTime) : '—'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Длительность</h3>
            <p className="mt-1">{appointment.duration} минут</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Количество гостей</h3>
            <p className="mt-1">{appointment.guestsCount ?? '—'}</p>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Примечания</h3>
            <p className="mt-1 rounded-lg bg-[rgb(var(--tc-muted))]/10 p-3">{appointment.notes}</p>
          </div>
        )}

        {/* QR Code */}
        {appointment.qrCode && (
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">QR-код</h3>
            <div className="mt-2 rounded-lg bg-white p-4 text-center">
              <p className="text-xs text-gray-500">QR: {appointment.qrCode}</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[rgb(var(--tc-muted))]">Создано:</span>
            <span>{formatDate(appointment.createdAt)}</span>
          </div>
          {appointment.confirmedAt && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--tc-muted))]">Подтверждено:</span>
              <span>{formatDate(appointment.confirmedAt)}</span>
            </div>
          )}
          {appointment.completedAt && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--tc-muted))]">Завершено:</span>
              <span>{formatDate(appointment.completedAt)}</span>
            </div>
          )}
          {appointment.cancelledAt && (
            <div className="flex justify-between">
              <span className="text-[rgb(var(--tc-muted))]">Отменено:</span>
              <span>{formatDate(appointment.cancelledAt)}</span>
            </div>
          )}
        </div>

        {/* Cancellation reason */}
        {status === 'CANCELLED' && appointment.cancellationReason && (
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--tc-muted))]">Причина отмены</h3>
            <p className="mt-1 rounded-lg bg-red-50 p-3 text-red-700">
              {appointment.cancellationReason}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
