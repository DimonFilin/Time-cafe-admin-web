import { NextRequest } from 'next/server';

import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';
import { env } from '@/shared/config/env';

export async function POST(req: NextRequest, ctx: { params: Promise<{ bucket: string }> }) {
  const { bucket } = await ctx.params;
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const path = formData.get('path') as string;

  if (!file || !path) {
    return new Response(JSON.stringify({ message: 'File and path are required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const uploadFormData = new FormData();
  uploadFormData.append('file', file);
  uploadFormData.append('path', path);

  return fetchWithAuthRefresh(`${env.backendUrl}/admin/storage/upload/${bucket}`, {
    method: 'POST',
    body: uploadFormData,
    headers: {
      // Don't set Content-Type, let fetch set it with boundary
    },
  });
}
