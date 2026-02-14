import { clientFetch } from '@/shared/lib/client-fetch';
import type {
  Appointment,
  AppointmentsResponse,
  ConfirmAppointmentDto,
  CheckInAppointmentDto,
  CancelAppointmentDto,
} from '../types/appointments.types';

function normalizeAppointment(raw: Appointment): Appointment {
  const status =
    typeof raw.status === 'string'
      ? (raw.status.toUpperCase() as Appointment['status'])
      : raw.status;
  const appointmentDate = raw.appointmentDate ?? raw.dateTime;
  return {
    ...raw,
    status,
    appointmentDate,
  };
}

function normalizeAppointmentsResponse(raw: AppointmentsResponse): AppointmentsResponse {
  if (!raw || !Array.isArray(raw.items)) return raw;
  return { ...raw, items: raw.items.map(normalizeAppointment) };
}

export const appointmentsApi = {
  // Получить активные бронирования (без фильтра - фильтруем на фронте)
  async getActiveAppointments(cafeId: string): Promise<AppointmentsResponse> {
    const res = await clientFetch<AppointmentsResponse>(`/api/appointments/cafe/${cafeId}`);
    return normalizeAppointmentsResponse(res);
  },

  // Получить историю бронирований (без фильтра - фильтруем на фронте)
  async getAppointmentsHistory(cafeId: string): Promise<AppointmentsResponse> {
    const res = await clientFetch<AppointmentsResponse>(`/api/appointments/cafe/${cafeId}`);
    return normalizeAppointmentsResponse(res);
  },

  // Получить детали бронирования
  async getAppointmentById(appointmentId: string, cafeId: string): Promise<Appointment> {
    const res = await clientFetch<Appointment>(`/api/appointments/cafe/${cafeId}/${appointmentId}`);
    return normalizeAppointment(res);
  },

  // Подтвердить бронирование
  async confirmAppointment(dto: ConfirmAppointmentDto): Promise<Appointment> {
    return clientFetch<Appointment>(`/api/appointments/confirm/${dto.appointmentId}`, {
      method: 'POST',
      body: JSON.stringify({ cafeId: dto.cafeId }),
    });
  },

  // Отметить как пришедшего (check-in) - используем confirm как check-in
  async checkInAppointment(dto: CheckInAppointmentDto): Promise<Appointment> {
    return clientFetch<Appointment>(`/api/appointments/checkin/${dto.appointmentId}`, {
      method: 'POST',
    });
  },

  // Отменить бронирование
  async cancelAppointment(dto: CancelAppointmentDto): Promise<Appointment> {
    return clientFetch<Appointment>(`/api/appointments/${dto.appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: dto.reason }),
    });
  },
};
