'use client';

import { useEffect, useState } from 'react';

import type { AccountRole } from '@/shared/types/worker-role';
import type { MeResponse } from '@/shared/types/me';
import { Card } from '@/shared/ui/card/Card';
import { RoleBadge } from '@/shared/ui/role-badge/RoleBadge';

export function RoleDashboard({ expectedRole }: { expectedRole: AccountRole }) {
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return (await r.json()) as MeResponse;
      })
      .then((json) => {
        if (!cancelled) {
          setError(null);
          setData(json);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Панель</div>
          <div className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
            Пока пустая. Здесь будет функционал по роли.
          </div>
        </div>
        <RoleBadge role={(data?.role ?? expectedRole) as AccountRole} />
      </div>

      <Card className="p-5">
        <div className="text-sm font-semibold">Аккаунт</div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[rgb(var(--tc-muted))]">expectedRole:</span>
            <span className="font-mono">{expectedRole}</span>
          </div>
          {data?.role && data.role !== expectedRole && (
            <div className="text-xs text-[rgb(var(--tc-danger))]">
              Роль в сессии ({data.role}) не совпадает с этой страницей ({expectedRole})
            </div>
          )}
          {error && <div className="text-sm text-[rgb(var(--tc-danger))]">{error}</div>}
          {data && (
            <pre className="mt-2 overflow-auto rounded-xl bg-[rgb(var(--tc-surface-2))] p-3 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </Card>
    </div>
  );
}
