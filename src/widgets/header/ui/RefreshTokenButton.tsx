'use client';

import { useState } from 'react';

export function RefreshTokenButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    console.log('[RefreshTokenButton] Starting manual token refresh...');

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      console.log('[RefreshTokenButton] Response status:', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('[RefreshTokenButton] Refresh failed:', text);
        setError(`Failed: ${res.status} - ${text}`);
        return;
      }

      const data = await res.json();
      console.log('[RefreshTokenButton] Refresh successful:', data);
      setMessage(`Success! Expires in ${data.expiresIn}s`);

      // Check cookies after refresh
      setTimeout(() => {
        console.log('[RefreshTokenButton] Checking cookies after refresh...');
        const cookies = document.cookie.split(';');
        const accessCookie = cookies.find((c) => c.trim().startsWith('tc_access='));
        const refreshCookie = cookies.find((c) => c.trim().startsWith('tc_refresh='));
        console.log('[RefreshTokenButton] Has access cookie:', !!accessCookie);
        console.log('[RefreshTokenButton] Has refresh cookie:', !!refreshCookie);
        // Note: httpOnly cookies won't be visible in document.cookie, but we can check if request works
      }, 100);
    } catch (e) {
      console.error('[RefreshTokenButton] Error:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="rounded-lg px-3 py-2 text-xs hover:bg-[rgb(var(--tc-surface-2))] hover:text-[rgb(var(--tc-fg))] disabled:opacity-50"
        type="button"
      >
        {loading ? 'Refreshing...' : '🔄 Refresh Token'}
      </button>
      {message && <span className="text-xs text-green-600 dark:text-green-400">{message}</span>}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
