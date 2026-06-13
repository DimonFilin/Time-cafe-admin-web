'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { TopUpPreviewModal, type TopUpPreview } from './TopUpPreviewModal';

type PaymentCard = {
  id: string;
  last4Digits: string;
  cardType: string;
  isDefault: boolean;
};

type Props = {
  guestId: string;
  cafeId?: string | null;
  apiPrefix: 'cafe-worker' | 'system-admin';
  onSuccess?: () => void;
};

export function GuestTopUpForm({ guestId, cafeId, apiPrefix, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'card'>('cash');
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cardId, setCardId] = useState<string | null>(null);
  const [preview, setPreview] = useState<TopUpPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (payMode !== 'card') return;
    void (async () => {
      const res = await fetch(`/api/${apiPrefix}/guests/${guestId}/payment-cards`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const list = (await res.json()) as PaymentCard[];
        setCards(list);
        setCardId(list.find((c) => c.isDefault)?.id ?? list[0]?.id ?? null);
      } else {
        setCards([]);
        setCardId(null);
      }
    })();
  }, [guestId, payMode, apiPrefix]);

  const paymentType = payMode === 'cash' ? 'TOP_UP_CASH' : 'TOP_UP_CARD';

  const openPreview = async () => {
    if (!amount || Number(amount) <= 0) {
      setMessage({ kind: 'err', text: 'Укажите сумму пополнения' });
      return;
    }
    if (payMode === 'card' && !cardId) {
      setMessage({ kind: 'err', text: 'У клиента нет карт в приложении — выберите наличные' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/${apiPrefix}/guests/${guestId}/top-up/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentType,
          cafeId: cafeId ?? undefined,
          paymentCardId: payMode === 'card' ? cardId : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: 'err',
          text: data?.message ?? 'Ошибка при расчёте пополнения',
        });
        return;
      }
      setPreview(data as TopUpPreview);
      setPreviewOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/${apiPrefix}/guests/${guestId}/top-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentType,
          cafeId: cafeId ?? undefined,
          paymentCardId: payMode === 'card' ? cardId : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: 'err',
          text: data?.message ?? 'Ошибка при пополнении депозита',
        });
        return;
      }
      setPreviewOpen(false);
      setAmount('');
      setMessage({
        kind: 'ok',
        text: (data?.message as string) ?? 'Депозит успешно пополнен',
      });
      onSuccess?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Пополнение депозита</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={payMode === 'cash' ? 'primary' : 'secondary'}
          onClick={() => setPayMode('cash')}
        >
          Наличные
        </Button>
        <Button
          variant={payMode === 'card' ? 'primary' : 'secondary'}
          onClick={() => setPayMode('card')}
        >
          Карта клиента
        </Button>
      </div>
      {payMode === 'card' && (
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={cardId ?? ''}
          onChange={(e) => setCardId(e.target.value || null)}
          disabled={!cards.length}
        >
          {!cards.length ? (
            <option value="">Нет карт (клиент не в приложении)</option>
          ) : (
            cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cardType} •••• {c.last4Digits}
                {c.isDefault ? ' ★' : ''}
              </option>
            ))
          )}
        </select>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          type="number"
          placeholder="Сумма, BYN"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button disabled={busy} onClick={() => void openPreview()}>
          Пополнить
        </Button>
      </div>
      {message ? (
        <p
          className={`text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}
          role="alert"
        >
          {message.text}
        </p>
      ) : null}
      <TopUpPreviewModal
        open={previewOpen}
        preview={preview}
        onClose={() => setPreviewOpen(false)}
        onConfirm={() => void confirm()}
        displayMode="FULL"
      />
    </div>
  );
}
