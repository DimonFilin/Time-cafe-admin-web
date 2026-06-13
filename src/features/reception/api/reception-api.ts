import { clientFetch } from '@/shared/lib/client-fetch';

export type ReceptionGuest = {
  id: string;
  firstName: string;
  lastName?: string | null;
  patronymic?: string | null;
  phone: string;
  status: string;
  accessCardNumber?: string | null;
  displayName?: string;
  phoneVerified?: boolean;
  loyaltyTier?: { name: string; bonusPercent: string };
};

export type ReceptionAppointment = {
  id: string;
  dateTime: string;
  duration: number;
  status: string;
  notes?: string | null;
  room?: { id: string; name: string } | null;
  cafe: { id: string; name: string };
};

export type ReceptionScanResult = {
  guest: ReceptionGuest;
  appointmentsToday: ReceptionAppointment[];
  openAppointmentId?: string;
};

export const receptionApi = {
  scan(params: { payload?: string; accessCardNumber?: string; cafeId?: string }) {
    const q = new URLSearchParams();
    if (params.payload) q.set('payload', params.payload);
    if (params.accessCardNumber) q.set('accessCardNumber', params.accessCardNumber);
    if (params.cafeId) q.set('cafeId', params.cafeId);
    return clientFetch<ReceptionScanResult>(`/api/cafe-worker/reception/scan?${q.toString()}`);
  },

  guestToday(guestId: string) {
    return clientFetch<ReceptionScanResult>(
      `/api/cafe-worker/reception/guests/${guestId}/appointments/today`,
    );
  },
};
