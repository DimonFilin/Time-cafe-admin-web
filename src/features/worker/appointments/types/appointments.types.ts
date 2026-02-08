export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  userId: string;
  cafeId: string;
  appointmentDate: string;
  duration: number; // в минутах
  guestsCount: number;
  status: AppointmentStatus;
  notes?: string;
  qrCode?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  cancellationReason?: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
  };
}

export interface AppointmentsResponse {
  items: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConfirmAppointmentDto {
  appointmentId: string;
  cafeId: string;
}

export interface CheckInAppointmentDto {
  appointmentId: string;
  cafeId: string;
}

export interface CancelAppointmentDto {
  appointmentId: string;
  cafeId: string;
  reason: string;
}
