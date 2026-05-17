'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Logo } from '@/shared/ui/logo/Logo';
import { ThemeToggle } from '@/shared/ui/theme-toggle/ThemeToggle';
import { logWorkerActivity } from '@/shared/lib/log-worker-activity';
import {
  ActivityAction,
  ActivityCategory,
} from '@/features/brand-admin/activity-logs/api/activity-logs-api';

export function Header() {
  const pathname = usePathname();
  const [sessionOk, setSessionOk] = useState(false);

  const isAuthed = pathname === '/login' ? false : sessionOk;

  useEffect(() => {
    if (pathname === '/login') {
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (cancelled) return;
        setSessionOk(res.ok);
      } catch {
        if (cancelled) return;
        setSessionOk(false);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))]">
      <div className="mx-auto flex max-w-[1224px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <nav className="hidden items-center gap-1 text-sm text-[rgb(var(--tc-muted))] sm:flex">
            {isAuthed ? (
              <form
                action="/api/auth/logout"
                method="post"
                onSubmit={() => {
                  logWorkerActivity({
                    action: ActivityAction.LOGOUT,
                    category: ActivityCategory.AUTH,
                    resourceType: 'SESSION',
                  });
                }}
              >
                <button
                  className="rounded-lg px-3 py-2 hover:bg-[rgb(var(--tc-surface-2))] hover:text-[rgb(var(--tc-fg))]"
                  type="submit"
                >
                  Выйти из аккаунта
                </button>
              </form>
            ) : (
              <Link
                className="rounded-lg px-3 py-2 hover:bg-[rgb(var(--tc-surface-2))] hover:text-[rgb(var(--tc-fg))]"
                href="/login"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
