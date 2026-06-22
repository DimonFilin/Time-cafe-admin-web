'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/Card';
import { QrScanModal } from '@/shared/ui/qr/QrScanModal';
import { parseScudQrPayload } from '@/shared/lib/scud-qr';
import {
  receptionApi,
  type ReceptionAppointment,
  type ReceptionGuest,
  type ReceptionScanResult,
} from '../api/reception-api';
import { GuestRegistrationPanel } from './GuestRegistrationPanel';
import { ReceptionAppointmentDetail } from './ReceptionAppointmentDetail';

type Props = {
  cafeId: string;
};

export function ReceptionScanTab({ cafeId }: Props) {
  const [manualPhone, setManualPhone] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceptionScanResult | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ReceptionAppointment | null>(null);
  const [loading, setLoading] = useState(false);

  const applyResult = (data: ReceptionScanResult) => {
    setResult(data);
    if (data.openAppointmentId) {
      const apt = data.appointmentsToday.find((a) => a.id === data.openAppointmentId);
      setSelectedAppointment(apt ?? null);
    } else {
      setSelectedAppointment(null);
    }
    setScanOpen(false);
  };

  const applyScan = async (raw: string) => {
    setLoading(true);
    setScanError(null);
    try {
      const card = parseScudQrPayload(raw);
      const data = await receptionApi.scan({
        payload: raw.trim(),
        accessCardNumber: card ?? undefined,
        cafeId,
      });
      applyResult(data);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Сканирование не удалось');
    } finally {
      setLoading(false);
    }
  };

  const applyByPhone = async (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setLoading(true);
    setScanError(null);
    try {
      const data = await receptionApi.scan({ phone: trimmed, cafeId });
      applyResult(data);
      setManualPhone(trimmed);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Клиент не найден');
    } finally {
      setLoading(false);
    }
  };

  const reloadToday = async (guest: ReceptionGuest) => {
    const data = await receptionApi.guestToday(guest.id);
    setResult(data);
    if (selectedAppointment) {
      const fresh = data.appointmentsToday.find((a) => a.id === selectedAppointment.id);
      setSelectedAppointment(fresh ?? null);
    } else if (data.openAppointmentId) {
      const apt = data.appointmentsToday.find((a) => a.id === data.openAppointmentId);
      setSelectedAppointment(apt ?? null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Ресепшен · СКУД</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setScanOpen(true)}>Сканировать QR</Button>
          <input
            className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm"
            type="tel"
            inputMode="tel"
            placeholder="Телефон клиента"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualPhone.trim()) {
                void applyByPhone(manualPhone);
              }
            }}
          />
          <Button
            disabled={!manualPhone.trim() || loading}
            onClick={() => void applyByPhone(manualPhone)}
          >
            Найти
          </Button>
        </div>
        {scanError ? <p className="text-sm text-red-600">{scanError}</p> : null}
      </Card>

      {result ? (
        <Card className="p-4 space-y-2">
          <p className="font-medium">
            {result.guest.displayName ?? result.guest.firstName} · {result.guest.phone}
          </p>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Статус: {result.guest.status}
            {result.guest.accessCardNumber ? ` · карта ${result.guest.accessCardNumber}` : ''}
          </p>
          {result.appointmentsToday.length === 0 ? (
            <p className="text-sm text-[rgb(var(--tc-muted))]">Броней на сегодня нет</p>
          ) : result.appointmentsToday.length === 1 && selectedAppointment ? (
            <ReceptionAppointmentDetail
              cafeId={cafeId}
              appointment={selectedAppointment}
              onUpdated={() => void reloadToday(result.guest)}
            />
          ) : (
            <ul className="space-y-2">
              {result.appointmentsToday.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-[rgb(var(--tc-surface-2))]"
                    onClick={() => setSelectedAppointment(a)}
                  >
                    {new Date(a.dateTime).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {a.status}
                    {a.room?.name ? ` · ${a.room.name}` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedAppointment && result.appointmentsToday.length > 1 ? (
            <ReceptionAppointmentDetail
              cafeId={cafeId}
              appointment={selectedAppointment}
              onUpdated={() => void reloadToday(result.guest)}
            />
          ) : null}
        </Card>
      ) : null}

      <GuestRegistrationPanel
        guest={result?.guest ?? null}
        onSaved={(g) => {
          setResult((prev) => (prev ? { ...prev, guest: g } : { guest: g, appointmentsToday: [] }));
        }}
      />

      <QrScanModal
        open={scanOpen}
        mode="reception"
        title="Сканировать карту СКУД"
        description="Наведите камеру на QR-код карты клиента."
        errorText={scanError}
        onClose={() => setScanOpen(false)}
        onDetected={(text) => void applyScan(text)}
        onPhoneSubmit={(phone) => void applyByPhone(phone)}
      />
    </div>
  );
}
