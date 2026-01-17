'use client';

import type {
  Appointment,
  AppointmentListResponse,
  AppointmentStatus,
} from '@/entities/appointment/types/appointment';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  const text = await res.text();
  return text ? formatApiErrorFromText(text) : `${res.status} ${res.statusText}`;
}

export async function listCafeAppointments(input: {
  cafeId: string;
  page: number;
  limit: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}): Promise<AppointmentListResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(input.page));
  qs.set('limit', String(input.limit));
  if (input.status) qs.set('status', input.status);
  if (input.from) qs.set('from', input.from);
  if (input.to) qs.set('to', input.to);

  const res = await fetch(`/api/system-admin/appointments/cafe/${input.cafeId}?${qs.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AppointmentListResponse;
}

export async function getCafeAppointment(input: {
  cafeId: string;
  appointmentId: string;
}): Promise<Appointment> {
  const res = await fetch(
    `/api/system-admin/appointments/cafe/${input.cafeId}/${input.appointmentId}`,
    {
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Appointment;
}

export async function confirmAppointment(input: { appointmentId: string }): Promise<Appointment> {
  const res = await fetch(`/api/system-admin/appointments/${input.appointmentId}/confirm`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Appointment;
}
