'use client';

import { useTheme } from 'next-themes';

import { Button } from '@/shared/ui/button/Button';
import { useIsMounted } from '@/shared/lib/use-is-mounted';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    // Avoid SSR/CSR mismatch: theme is unknown on the server.
    return (
      <Button variant="secondary" className="h-10 px-3" aria-label="Переключить тему" disabled>
        <span className="text-xs">Тема</span>
      </Button>
    );
  }

  const resolved = theme === 'system' ? systemTheme : theme;
  const isDark = resolved === 'dark';

  return (
    <Button
      variant="secondary"
      className="h-10 px-3"
      aria-label="Переключить тему"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <span className="text-xs">{isDark ? 'Светлая' : 'Тёмная'}</span>
    </Button>
  );
}
