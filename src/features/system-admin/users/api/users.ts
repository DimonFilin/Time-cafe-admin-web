'use client';

import type {
  User,
  UserListResponse,
  UpdateUserData,
  UserListQuery,
} from '@/entities/user/types/user';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  try {
    const json = await res.json();
    return formatApiErrorFromText(JSON.stringify(json));
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function listUsers(query?: UserListQuery): Promise<UserListResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', query.page.toString());
  if (query?.limit) params.set('limit', query.limit.toString());
  if (query?.email) params.set('email', query.email);
  if (query?.firstName) params.set('firstName', query.firstName);
  if (query?.includeDeleted) params.set('includeDeleted', 'true');

  const queryString = params.toString();
  const url = `/api/system-admin/users${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as UserListResponse;
}

export async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/system-admin/users/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as User;
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const res = await fetch(`/api/system-admin/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as User;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/system-admin/users/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error(await readError(res));
}
