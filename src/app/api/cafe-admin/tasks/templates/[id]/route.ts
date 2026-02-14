import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const url = `${env.backendUrl}/cafe-admin/tasks/templates/${id}`;

    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cafe admin task template PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update task template' }, { status: 500 });
  }
}
