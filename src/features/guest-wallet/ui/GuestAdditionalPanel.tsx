'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { listTiers, type LoyaltyTier } from '@/features/system-admin/loyalty/api/loyalty-api';

type LedgerItem = {
  id: string;
  type: string;
  label: string;
  amount: number;
  depositAfter: number;
  debtAfter: number;
  createdAt: string;
};

type TierHistoryItem = {
  id: string;
  reason: string;
  createdAt: string;
  changedByName?: string;
  fromTier?: { name: string } | null;
  toTier: { name: string };
};

type Props = {
  guestId: string;
  apiPrefix: 'system-admin' | 'cafe-worker';
  currentTierName?: string;
  onTierChanged?: () => void;
};

export function GuestAdditionalPanel({
  guestId,
  apiPrefix,
  currentTierName,
  onTierChanged,
}: Props) {
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [tierHistory, setTierHistory] = useState<TierHistoryItem[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [tierId, setTierId] = useState('');
  const [tierReason, setTierReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [ledgerRes, histRes] = await Promise.all([
      fetch(`/api/${apiPrefix}/guests/${guestId}/ledger`, { cache: 'no-store' }),
      fetch(`/api/${apiPrefix}/guests/${guestId}/tier-history`, { cache: 'no-store' }),
    ]);
    if (ledgerRes.ok) {
      const data = await ledgerRes.json();
      setLedger(data.items ?? []);
    }
    if (histRes.ok) {
      setTierHistory(await histRes.json());
    }
  }, [apiPrefix, guestId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadTiers = async () => {
      if (apiPrefix === 'system-admin') {
        try {
          setTiers(await listTiers());
        } catch {
          setTiers([]);
        }
        return;
      }
      const res = await fetch('/api/cafe-worker/loyalty/tiers', { cache: 'no-store' });
      if (res.ok) setTiers(await res.json());
    };
    void loadTiers();
  }, [apiPrefix]);

  const changeTier = async () => {
    if (!tierId || !tierReason.trim()) {
      setError('Выберите уровень и укажите причину');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/${apiPrefix}/guests/${guestId}/tier`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId, reason: tierReason.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? 'Не удалось сменить уровень');
      return;
    }
    setTierReason('');
    await load();
    onTierChanged?.();
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-sm">Дополнительно</h3>
      <p className="text-sm text-[rgb(var(--tc-muted))]">
        Уровень лояльности: <strong>{currentTierName ?? '—'}</strong>
      </p>

      {tiers.length > 0 ? (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-medium text-[rgb(var(--tc-muted))]">
            Смена уровня ({apiPrefix === 'system-admin' ? 'администратор' : 'сотрудник'})
          </p>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
          >
            <option value="">— выберите уровень —</option>
            {tiers
              .filter((t) => t.isActive)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({Number(t.bonusPercent)}%)
                </option>
              ))}
          </select>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Причина смены уровня"
            value={tierReason}
            onChange={(e) => setTierReason(e.target.value)}
          />
          <Button onClick={() => void changeTier()} disabled={loading}>
            Сохранить уровень
          </Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium mb-2 text-[rgb(var(--tc-muted))]">История уровней</p>
        <ul className="text-sm space-y-1 max-h-40 overflow-auto">
          {tierHistory.length === 0 ? (
            <li className="text-[rgb(var(--tc-muted))]">Нет записей</li>
          ) : (
            tierHistory.map((h) => (
              <li key={h.id} className="border-b border-[rgb(var(--tc-border))] py-1">
                {new Date(h.createdAt).toLocaleString('ru-RU')} —{' '}
                {h.fromTier?.name ? `${h.fromTier.name} → ` : ''}
                {h.toTier.name}
                <span className="block text-xs text-[rgb(var(--tc-muted))]">
                  {h.reason}
                  {h.changedByName ? ` · ${h.changedByName}` : ''}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium mb-2 text-[rgb(var(--tc-muted))]">Операции по депозиту</p>
        <ul className="text-sm space-y-1 max-h-48 overflow-auto">
          {ledger.length === 0 ? (
            <li className="text-[rgb(var(--tc-muted))]">Нет операций</li>
          ) : (
            ledger.map((e) => (
              <li key={e.id} className="border-b border-[rgb(var(--tc-border))] py-1">
                {new Date(e.createdAt).toLocaleString('ru-RU')} — {e.label}
                <span className="block text-xs">
                  {e.amount >= 0 ? '+' : ''}
                  {e.amount.toFixed(2)} BYN · депозит {e.depositAfter.toFixed(2)} · долг{' '}
                  {e.debtAfter.toFixed(2)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
