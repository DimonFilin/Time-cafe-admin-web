import { Cafe, UpdateCafeDto, type CafeSchedule } from '../types/cafe.types';
import { cafeScheduleToApiBody } from '../lib/schedule-map';
import { normalizeCafe } from './normalize-cafe';

export async function getMyCafe(): Promise<Cafe> {
  const response = await fetch('/api/cafe-admin/cafe', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('getMyCafe error:', text);
    throw new Error('Failed to fetch cafe information');
  }

  return normalizeCafe(await response.json());
}

export async function updateMyCafe(data: UpdateCafeDto): Promise<Cafe> {
  const response = await fetch('/api/cafe-admin/cafe', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('updateMyCafe error:', text);
    throw new Error('Failed to update cafe information');
  }

  return normalizeCafe(await response.json());
}

export async function updateCafeSchedule(schedule: CafeSchedule): Promise<Cafe> {
  const response = await fetch('/api/cafe-admin/cafe/schedule', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(cafeScheduleToApiBody(schedule)),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('updateCafeSchedule error:', text);
    throw new Error('Failed to update cafe schedule');
  }

  return normalizeCafe(await response.json());
}
