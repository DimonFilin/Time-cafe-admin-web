import { Cafe, UpdateCafeDto, UpdateCafeScheduleDto } from '../types/cafe.types';

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

  return response.json();
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

  return response.json();
}

export async function updateCafeSchedule(data: UpdateCafeScheduleDto): Promise<Cafe> {
  const response = await fetch('/api/cafe-admin/cafe/schedule', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('updateCafeSchedule error:', text);
    throw new Error('Failed to update cafe schedule');
  }

  return response.json();
}
