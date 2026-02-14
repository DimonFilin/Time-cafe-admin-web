import type { Appointment } from '../types/appointments.types';

export type NormalizedAppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export function normalizeAppointmentStatus(
  status: Appointment['status'] | string | null | undefined,
): NormalizedAppointmentStatus | null {
  if (!status) return null;
  const s = String(status).trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (
    upper === 'PENDING' ||
    upper === 'CONFIRMED' ||
    upper === 'CANCELLED' ||
    upper === 'COMPLETED'
  )
    return upper;
  return null;
}

export function getAppointmentDateTime(appointment: Appointment): string | null {
  return appointment.appointmentDate ?? appointment.dateTime ?? null;
}

export function getAppointmentCustomerName(appointment: Appointment): string {
  if (appointment.user?.firstName || appointment.user?.lastName) {
    return (
      `${appointment.user?.firstName ?? ''} ${appointment.user?.lastName ?? ''}`.trim() || 'Гость'
    );
  }
  if (appointment.userId) return `Пользователь ${appointment.userId}`;
  return 'Гость';
}

export function getAppointmentCustomerEmail(appointment: Appointment): string | null {
  return appointment.user?.email ?? null;
}

export function getAppointmentCustomerPhone(appointment: Appointment): string | null {
  return appointment.user?.phone ?? null;
}
