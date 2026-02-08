'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/Input';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderNumber: string;
}

const CANCEL_REASONS = [
  'Клиент отменил заказ',
  'Нет необходимых ингредиентов',
  'Технические проблемы',
  'Ошибка в заказе',
  'Другое',
];

export function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
}: CancelOrderModalProps) {
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
    <Modal open={isOpen} onClose={handleClose} title={`Отмена заказа #${orderNumber}`}>
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--tc-muted))]">Выберите причину отмены заказа:</p>

        {/* Reason options */}
        <div className="space-y-2">
          {CANCEL_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[rgb(var(--tc-border))] p-3 transition-colors hover:bg-[rgb(var(--tc-muted))]/5"
            >
              <input
                type="radio"
                name="cancelReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="h-4 w-4 text-[rgb(var(--tc-accent))]"
              />
              <span className="text-sm">{reason}</span>
            </label>
          ))}
        </div>

        {/* Custom reason input */}
        {selectedReason === 'Другое' && (
          <div>
            <label className="mb-2 block text-sm font-medium">Укажите причину</label>
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Введите причину отмены..."
              required
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'Другое' && !customReason.trim())}
            className="flex-1"
          >
            Подтвердить отмену
          </Button>
        </div>
      </div>
    </Modal>
  );
}
