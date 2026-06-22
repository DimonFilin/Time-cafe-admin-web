'use client';

/**
 * Client-side fetch with automatic token refresh on 401.
 * Calls BFF /api/auth/refresh, then retries the original request once.
 */
export async function fetchWithAuthRetry(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const request = () =>
    fetch(url, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
    });

  let response = await request();

  if (response.status !== 401) {
    return response;
  }

  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });

  if (refreshRes.ok) {
    response = await request();
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = '/login?next=' + encodeURIComponent(currentPath);
    }
    return Promise.reject(new Error('Session expired - please login again'));
  }

  return response;
}
