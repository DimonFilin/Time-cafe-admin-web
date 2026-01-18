'use client';

import type { StorageFileList, StorageBucket } from '@/entities/storage/types/storage';
import { formatApiErrorFromText } from '@/shared/lib/format-api-error';

async function readError(res: Response) {
  try {
    const json = await res.json();
    return formatApiErrorFromText(JSON.stringify(json));
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function getBuckets(): Promise<{ buckets: StorageBucket }> {
  const res = await fetch('/api/system-admin/storage/buckets', {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { buckets: StorageBucket };
}

export async function listFiles(bucket: string, prefix?: string): Promise<StorageFileList> {
  const query = new URLSearchParams();
  if (prefix) query.set('prefix', prefix);

  const res = await fetch(
    `/api/system-admin/storage/files/${bucket}${query.toString() ? `?${query.toString()}` : ''}`,
    {
      cache: 'no-store',
      credentials: 'include',
    },
  );

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as StorageFileList;
}

export async function getFileDownloadUrl(bucket: string, path: string): Promise<string> {
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
  const res = await fetch(`/api/system-admin/storage/files/${bucket}/${encodedPath}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
  const res = await fetch(`/api/system-admin/storage/files/${bucket}/${encodedPath}`, {
    method: 'DELETE',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) throw new Error(await readError(res));
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<{ message: string; result: unknown }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);

  const res = await fetch(`/api/system-admin/storage/upload/${bucket}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { message: string; result: unknown };
}
