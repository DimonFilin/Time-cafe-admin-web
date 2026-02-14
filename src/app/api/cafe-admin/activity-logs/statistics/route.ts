import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

const env = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${env.backendUrl}/cafe-admin/activity-logs/stats${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Cafe admin activity logs stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs statistics' },
      { status: 500 },
    );
  }
}
