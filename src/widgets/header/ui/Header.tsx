import Link from 'next/link';
import { cookies } from 'next/headers';

import { Logo } from '@/shared/ui/logo/Logo';
import { ThemeToggle } from '@/shared/ui/theme-toggle/ThemeToggle';

export async function Header() {
  const cookieStore = await cookies();
  const isAuthed = Boolean(cookieStore.get('tc_access')?.value);

  return (
    <header className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))]">
      <div className="mx-auto flex max-w-[1224px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <nav className="hidden items-center gap-1 text-sm text-[rgb(var(--tc-muted))] sm:flex">
            {isAuthed ? (
              <form action="/api/auth/logout" method="post">
                <button
                  className="rounded-lg px-3 py-2 hover:bg-[rgb(var(--tc-surface-2))] hover:text-[rgb(var(--tc-fg))]"
                  type="submit"
                >
                  Logout
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
            <Link
              className="rounded-lg px-3 py-2 hover:bg-[rgb(var(--tc-surface-2))] hover:text-[rgb(var(--tc-fg))]"
              href="/admin"
            >
              Backend ping
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
