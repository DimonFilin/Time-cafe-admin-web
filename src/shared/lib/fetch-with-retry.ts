'use client';

/**
 * Client-side fetch with automatic retry on 401
 * BFF handles refresh automatically, but we retry once if 401 is returned
 * This ensures user doesn't see error immediately
 */
export async function fetchWithAuthRetry(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // First attempt - BFF will try to refresh if needed
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
  });

  // If 401, BFF might have refreshed tokens but request still failed
  // Retry once to give BFF another chance with fresh tokens
  if (response.status === 401) {
    console.log('[fetch-with-retry] Got 401, waiting and retrying once...');

    // Wait a bit to allow BFF to refresh tokens (if it hasn't already)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Retry the request - BFF should use refreshed tokens now
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
    });

    // If still 401 after retry, refresh token is likely expired
    // Redirect to login
    if (response.status === 401) {
      console.error(
        '[fetch-with-retry] Still 401 after retry - refresh token expired, redirecting to login',
      );
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = '/login?next=' + encodeURIComponent(currentPath);
      // Return a rejected promise to stop execution
      return Promise.reject(new Error('Session expired - please login again'));
    }

    console.log('[fetch-with-retry] Retry succeeded after refresh');
  }

  return response;
}
