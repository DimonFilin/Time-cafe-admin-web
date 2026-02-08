'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointmentInfo: string;
}

const CANCEL_REASONS = [
  'Клиент не пришел',
  'Клиент отменил',
  'Технические проблемы',
  'Нет свободных мест',
  'Другое',
];

export function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  appointmentInfo,
}: CancelAppointmentModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'Другое' ? customReason : selectedReason;
    if (reason.trim()) {
      onConfirm(reason);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Отменить бронирование">
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--tc-muted))]">
          Вы уверены, что хотите отменить бронирование <strong>{appointmentInfo}</strong>?
        </p>

        <div>
          <label className="mb-2 block text-sm font-medium">Причина отмены</label>
          <div className="space-y-2">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedReason === 'Другое' && (
          <div>
            <label className="mb-2 block text-sm font-medium">Укажите причину</label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Введите причину отмены..."
              className="w-full rounded-lg border border-[rgb(var(--tc-border))] p-2 text-sm"
              rows={3}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'Другое' && !customReason.trim())}
            className="bg-red-500 hover:bg-red-600"
          >
            Подтвердить отмену
          </Button>
        </div>
      </div>
    </Modal>
  );
}
