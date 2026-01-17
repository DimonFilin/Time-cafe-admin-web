import Link from 'next/link';
import { fetchBackendPing } from '@/shared/api/backend';
import { AppShell } from '@/widgets/layout/AppShell';

export default async function AdminPage() {
  const ping = await fetchBackendPing();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Backend ping</h1>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Проверка связи с backend-shared:{' '}
            <span className="rounded-md bg-[rgb(var(--tc-surface-2))] px-2 py-1 font-mono text-[rgb(var(--tc-fg))]">
              {ping.status} / {ping.message}
            </span>
          </p>
        </header>

        <section className="rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4">
          <h2 className="text-sm font-semibold">Навигация</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="text-[rgb(var(--tc-accent))] hover:underline" href="/">
                Главная
              </Link>
            </li>
            <li>
              <Link className="text-[rgb(var(--tc-accent))] hover:underline" href="/login">
                Login
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
