'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/Card';
import { GUEST_PHONE_HINT, isValidGuestPhone, normalizeGuestPhone } from '@/shared/lib/guest-phone';
import type { ReceptionGuest } from '../api/reception-api';

type Props = {
  guest: ReceptionGuest | null;
  onSaved: (guest: ReceptionGuest) => void;
};

export function GuestRegistrationPanel({ guest, onSaved }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [phone, setPhone] = useState('');
  const [accessCardNumber, setAccessCardNumber] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [panelCode, setPanelCode] = useState<string | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const syncFromGuest = (g: ReceptionGuest) => {
    setFirstName(g.firstName ?? '');
    setLastName(g.lastName ?? '');
    setPatronymic(g.patronymic ?? '');
    setPhone(g.phone ?? '');
    setAccessCardNumber(g.accessCardNumber ?? '');
  };

  useEffect(() => {
    if (guest) syncFromGuest(guest);
  }, [guest?.id]);

  const apiBase = guest ? `/api/cafe-worker/guests/${guest.id}` : '/api/cafe-worker/guests';

  const run = async (fn: () => Promise<Response>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Ошибка запроса');
        return null;
      }
      return data as ReceptionGuest;
    } finally {
      setBusy(false);
    }
  };

  const createGuest = async () => {
    if (!isValidGuestPhone(phone)) {
      setError(GUEST_PHONE_HINT);
      return;
    }
    const normalized = normalizeGuestPhone(phone)!;
    const data = await run(() =>
      fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, patronymic, phone: normalized }),
      }),
    );
    if (data) {
      onSaved(data);
      syncFromGuest(data);
    }
  };

  const saveGuest = async () => {
    if (!guest) return;
    if (!isValidGuestPhone(phone)) {
      setError(GUEST_PHONE_HINT);
      return;
    }
    const normalized = normalizeGuestPhone(phone)!;
    const data = await run(() =>
      fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          patronymic,
          phone: normalized,
          accessCardNumber: accessCardNumber || undefined,
        }),
      }),
    );
    if (data) {
      onSaved(data);
      syncFromGuest(data);
    }
  };

  const requestCode = async () => {
    if (!guest) return;
    const res = await fetch(`${apiBase}/verify-phone/request`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message ?? 'Не удалось отправить код');
      return;
    }
    setPanelCode(data.code ?? null);
  };

  const confirmCode = async () => {
    if (!guest) return;
    const data = await run(() =>
      fetch(`${apiBase}/verify-phone/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      }),
    );
    if (data) {
      setPanelCode(null);
      onSaved(data);
      syncFromGuest(data);
    }
  };

  const refuse = async () => {
    if (!guest || !refuseReason.trim()) return;
    const data = await run(() =>
      fetch(`${apiBase}/refuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refusedReason: refuseReason }),
      }),
    );
    if (data) onSaved(data);
  };

  const restore = async () => {
    if (!guest) return;
    const data = await run(() => fetch(`${apiBase}/restore`, { method: 'POST' }));
    if (data) onSaved(data);
  };

  return (
    <Card className="p-4 space-y-3">
      <h2 className="font-semibold">Карточка клиента</h2>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-lg border px-3 py-2 text-sm"
          placeholder="Имя"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="rounded-lg border px-3 py-2 text-sm"
          placeholder="Фамилия"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          className="rounded-lg border px-3 py-2 text-sm"
          placeholder="Отчество"
          value={patronymic}
          onChange={(e) => setPatronymic(e.target.value)}
        />
        <input
          className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
          placeholder="+375291234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <p className="text-xs text-[rgb(var(--tc-muted))]">{GUEST_PHONE_HINT}</p>
      {!guest ? (
        <Button disabled={busy || !firstName || !phone} onClick={() => void createGuest()}>
          Создать клиента
        </Button>
      ) : (
        <>
          <p className="text-sm">
            {guest.displayName ?? `${guest.lastName ?? ''} ${guest.firstName}`} · {guest.status}
            {guest.phoneVerified ? ' · телефон подтверждён' : ''}
          </p>
          <Button disabled={busy} onClick={() => void saveGuest()}>
            Сохранить
          </Button>
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Подтверждение телефона</p>
            <Button variant="secondary" disabled={busy} onClick={() => void requestCode()}>
              Отправить код на телефон
            </Button>
            <p className="text-xs text-[rgb(var(--tc-muted))]">
              Код приходит в push-уведомление Android (как SMS), не в списке уведомлений приложения.
            </p>
            {panelCode ? (
              <p className="text-sm font-mono bg-[rgb(var(--tc-surface-2))] rounded px-2 py-1">
                Код на панели ресепшена: {panelCode}
              </p>
            ) : null}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                placeholder="Код из уведомления телефона"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
              />
              <Button disabled={busy || !verifyCode} onClick={() => void confirmCode()}>
                Подтвердить
              </Button>
            </div>
          </div>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Номер карты СКУД (до 20 символов)"
            maxLength={20}
            disabled={!guest.phoneVerified}
            value={accessCardNumber}
            onChange={(e) => setAccessCardNumber(e.target.value)}
          />
          {guest.status === 'ACTIVE' && (
            <div className="space-y-2">
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Причина отказа"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
              />
              <Button variant="secondary" disabled={busy} onClick={() => void refuse()}>
                Отказать в доступе
              </Button>
            </div>
          )}
          {guest.status === 'REFUSED' && (
            <Button disabled={busy} onClick={() => void restore()}>
              Восстановить клиента
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
