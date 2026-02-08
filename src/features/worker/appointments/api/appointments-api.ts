import { clientFetch } from '@/shared/lib/client-fetch';
import type {
  Appointment,
  AppointmentsResponse,
  ConfirmAppointmentDto,
  CheckInAppointmentDto,
  CancelAppointmentDto,
} from '../types/appointments.types';

export const appointmentsApi = {
  // Получить активные бронирования (без фильтра - фильтруем на фронте)
  async getActiveAppointments(cafeId: string): Promise<AppointmentsResponse> {
    return clientFetch<AppointmentsResponse>(`/api/appointments/cafe/${cafeId}`);
  },

  // Получить историю бронирований (без фильтра - фильтруем на фронте)
  async getAppointmentsHistory(cafeId: string): Promise<AppointmentsResponse> {
    return clientFetch<AppointmentsResponse>(`/api/appointments/cafe/${cafeId}`);
  },

  // Получить детали бронирования
  async getAppointmentById(appointmentId: string, cafeId: string): Promise<Appointment> {
    return clientFetch<Appointment>(`/api/appointments/cafe/${cafeId}/${appointmentId}`);
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
    return clientFetch<Appointment>(`/api/appointments/confirm/${dto.appointmentId}`, {
      method: 'POST',
      body: JSON.stringify({ cafeId: dto.cafeId }),
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
