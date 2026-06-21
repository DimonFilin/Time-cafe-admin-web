'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { GuestAdditionalPanel } from '@/features/guest-wallet/ui/GuestAdditionalPanel';
import { GuestTopUpForm } from '@/features/guest-wallet/ui/GuestTopUpForm';
import { t } from '@/i18n';

type Guest = {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  status: string;
  depositBalance: string;
  debt: string;
  loyaltyTier?: { name: string; bonusPercent: string };
  displayName?: string;
};

export function GuestsAdmin() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system-admin/guests', { cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        setGuests(list);
        if (selected) {
          const fresh = list.find((g: Guest) => g.id === selected.id);
          if (fresh) setSelected(fresh);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Клиенты сети</h2>
        <ul className="text-sm space-y-2 max-h-64 overflow-auto">
          {loading ? (
            <li className="px-2 py-1 text-[rgb(var(--tc-muted))]">{t('common.loading')}</li>
          ) : guests.length === 0 ? (
            <li className="px-2 py-1 text-[rgb(var(--tc-muted))]">Нет клиентов</li>
          ) : (
            guests.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className="w-full text-left hover:bg-[rgb(var(--tc-surface-2))] rounded px-2 py-1"
                  onClick={() => setSelected(g)}
                >
                  {g.displayName ?? [g.lastName, g.firstName].filter(Boolean).join(' ')} — {g.phone}{' '}
                  <span className="text-[rgb(var(--tc-muted))]">({g.status})</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>

      {selected && (
        <Card className="p-4 space-y-3">
          <p className="text-sm">
            Уровень: {selected.loyaltyTier?.name ?? '—'} (
            {Number(selected.loyaltyTier?.bonusPercent ?? 0)}%)
          </p>
          <p className="text-sm">Депозит: {Number(selected.depositBalance).toFixed(2)} BYN</p>
          <p className="text-sm">Долг: {Number(selected.debt).toFixed(2)} BYN</p>
          <GuestTopUpForm
            guestId={selected.id}
            apiPrefix="system-admin"
            onSuccess={() => void load()}
          />
          <GuestAdditionalPanel
            guestId={selected.id}
            apiPrefix="system-admin"
            currentTierName={selected.loyaltyTier?.name}
            onTierChanged={() => void load()}
          />
        </Card>
      )}
    </div>
  );
}
