import Link from 'next/link';

import { AppShell } from '@/widgets/layout/AppShell';

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">TimeCaffe Admin Web</h1>
        <p className="text-sm text-[rgb(var(--tc-muted))]">
          Стартовая страница для разработки админки. Начните с{' '}
          <Link className="font-medium text-[rgb(var(--tc-accent))] hover:underline" href="/login">
            /login
          </Link>
          .
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4 hover:bg-[rgb(var(--tc-surface-2))]"
            href="/login"
          >
            <div className="text-sm font-semibold">Войти</div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              Flow входа и выбор аккаунта
            </div>
          </Link>
          <Link
            className="rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-4 hover:bg-[rgb(var(--tc-surface-2))]"
            href="/admin"
          >
            <div className="text-sm font-semibold">Проверка backend</div>
            <div className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              Проверка связи с backend-shared
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
