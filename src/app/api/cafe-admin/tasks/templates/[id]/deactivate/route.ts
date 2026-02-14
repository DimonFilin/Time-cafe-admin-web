import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = `${env.backendUrl}/cafe-admin/tasks/templates/${id}/deactivate`;

    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
    });
  } catch (error) {
    console.error('Cafe admin task template deactivate error:', error);
    return NextResponse.json({ error: 'Failed to deactivate task template' }, { status: 500 });
  }
}
