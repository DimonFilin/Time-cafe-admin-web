'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { getCafes } from '../../cafes/api/cafes';
import { MenuTab } from '@/features/cafe-admin/menu/ui/MenuTab';
import { t } from '@/i18n';

export function BrandMenuTab() {
  const [cafes, setCafes] = useState<{ id: string; name: string }[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialCafeSelectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCafes({ page: 1, limit: 100 });
        if (!cancelled) {
          setCafes((res.items || []).map((c) => ({ id: c.id, name: c.name })));
          if (res.items?.length && !initialCafeSelectedRef.current) {
            initialCafeSelectedRef.current = true;
            setSelectedCafeId(res.items[0].id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('brandAdmin.menu.loadFailed'));
          setCafes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && cafes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[rgb(var(--tc-muted))]">{t('brandAdmin.menu.loadingCafes')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </Card>
    );
  }

  if (cafes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-[rgb(var(--tc-muted))]">{t('brandAdmin.menu.noCafes')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">{t('brandAdmin.menu.selectCafe')}</label>
        <select
          className="rounded-lg border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm min-w-[200px]"
          value={selectedCafeId ?? ''}
          onChange={(e) => setSelectedCafeId(e.target.value || null)}
        >
          {cafes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCafeId && <MenuTab cafeId={selectedCafeId} />}
    </div>
  );
}
