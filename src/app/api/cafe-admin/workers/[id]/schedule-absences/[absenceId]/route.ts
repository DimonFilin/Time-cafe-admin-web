import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/shared/config/env';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; absenceId: string }> },
) {
  try {
    const { id, absenceId } = await context.params;
    const url = `${env.backendUrl}/cafe-admin/workers/${id}/schedule-absences/${absenceId}`;
    return fetchWithAuthRefresh(url, { method: 'DELETE' });
  } catch (error) {
    console.error('[schedule-absences DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete absence' }, { status: 500 });
  }
}
