import { NextRequest, NextResponse } from 'next';
import { fetchWithAuthRefresh } from '@/shared/lib/with-auth-refresh';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const url = `${BACKEND_URL}/cafe-admin/cafe/my`;

    return fetchWithAuthRefresh(url, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Error fetching cafe info:', error);
    return NextResponse.json({ message: 'Failed to fetch cafe information' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${BACKEND_URL}/cafe-admin/cafe/my`;

    return fetchWithAuthRefresh(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating cafe info:', error);
    return NextResponse.json({ message: 'Failed to update cafe information' }, { status: 500 });
  }
}
