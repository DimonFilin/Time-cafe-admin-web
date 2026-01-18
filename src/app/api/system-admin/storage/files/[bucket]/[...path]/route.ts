import { NextRequest } from 'next/server';

import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const { bucket, path: pathArray } = await ctx.params;

  // Join path segments and remove bucket prefix if present
  let path = pathArray.join('/');
  if (path.startsWith(`${bucket}/`)) {
    path = path.substring(bucket.length + 1);
  }

  // Encode path properly for URL (keep slashes as slashes, encode other special chars)
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');

  console.log('[BFF] Get file URL:', {
    bucket,
    pathArray,
    path,
    encodedPath,
  });

  return fetchWithAuthRefresh(`${env.backendUrl}/admin/storage/files/${bucket}/${encodedPath}`, {
    method: 'GET',
  });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const { bucket, path: pathArray } = await ctx.params;

  // Join path segments and remove bucket prefix if present
  let path = pathArray.join('/');
  if (path.startsWith(`${bucket}/`)) {
    path = path.substring(bucket.length + 1);
  }

  // Encode path properly for URL (keep slashes as slashes, encode other special chars)
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');

  console.log('[BFF] Delete file:', {
    bucket,
    pathArray,
    path,
    encodedPath,
  });

  return fetchWithAuthRefresh(`${env.backendUrl}/admin/storage/files/${bucket}/${encodedPath}`, {
    method: 'DELETE',
  });
}
