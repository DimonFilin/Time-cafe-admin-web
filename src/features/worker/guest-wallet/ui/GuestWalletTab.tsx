'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { QrScanModal } from '@/shared/ui/qr/QrScanModal';
import { parseScudQrPayload } from '@/shared/lib/scud-qr';
import { GuestAdditionalPanel } from '@/features/guest-wallet/ui/GuestAdditionalPanel';
import { GuestTopUpForm } from '@/features/guest-wallet/ui/GuestTopUpForm';
import { workerApi } from '../../api/worker-api';

type Guest = {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  depositBalance?: string;
  debt?: string;
  loyaltyTier?: { name: string; bonusPercent: string };
  displayName?: string;
  accessCardNumber?: string | null;
};

export function GuestWalletTab() {
  const [query, setQuery] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const loadWorker = async () => {
    const me = await workerApi.getMe();
    setCafeId(me.cafeId ?? null);
  };

  const lookupByValue = async (raw: string) => {
    await loadWorker();
    setLookupError(null);
    const trimmed = raw.trim();
    const card = parseScudQrPayload(trimmed);
    const isCard =
      card || (/^[A-Za-z0-9\-_.]{1,20}$/.test(trimmed) && !/^\+?\d{10,}$/.test(trimmed));
    const url = isCard
      ? `/api/cafe-worker/guests/lookup?${card ? `payload=${encodeURIComponent(trimmed)}&accessCardNumber=${encodeURIComponent(card)}` : `accessCardNumber=${encodeURIComponent(trimmed)}`}`
      : `/api/cafe-worker/guests/lookup?phone=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLookupError(data?.message ?? 'Клиент не найден');
      setGuest(null);
      return;
    }
    setGuest(await res.json());
    setQuery(card ?? trimmed);
  };

  const refreshGuest = async () => {
    if (!guest) return;
    const res = await fetch(`/api/cafe-worker/guests/${guest.id}`, { cache: 'no-store' });
    if (res.ok) setGuest(await res.json());
  };

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-semibold">Депозит клиента</h2>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Телефон или карта СКУД"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => void lookupByValue(query)}>Найти</Button>
        <Button variant="secondary" onClick={() => setQrOpen(true)}>
          Сканировать QR
        </Button>
      </div>
      {lookupError ? <p className="text-sm text-red-600">{lookupError}</p> : null}
      {guest && (
        <>
          <p className="text-sm">
            {guest.displayName ?? `${guest.lastName ?? ''} ${guest.firstName}`.trim()} —{' '}
            {guest.phone}
            {guest.accessCardNumber ? ` · ${guest.accessCardNumber}` : ''}
          </p>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Депозит: {Number(guest.depositBalance ?? 0).toFixed(2)} BYN · долг:{' '}
            {Number(guest.debt ?? 0).toFixed(2)} BYN · {guest.loyaltyTier?.name} (
            {Number(guest.loyaltyTier?.bonusPercent ?? 0)}%)
          </p>
          <GuestTopUpForm
            guestId={guest.id}
            cafeId={cafeId}
            apiPrefix="cafe-worker"
            onSuccess={() => void refreshGuest()}
          />
          <GuestAdditionalPanel
            guestId={guest.id}
            apiPrefix="cafe-worker"
            currentTierName={guest.loyaltyTier?.name}
            onTierChanged={() => void refreshGuest()}
          />
        </>
      )}
      <QrScanModal
        open={qrOpen}
        title="Сканировать карту СКУД"
        description="QR с карты клиента или пропуска"
        onClose={() => setQrOpen(false)}
        onDetected={(text) => {
          setQrOpen(false);
          void lookupByValue(text);
        }}
      />
    </Card>
  );
}
