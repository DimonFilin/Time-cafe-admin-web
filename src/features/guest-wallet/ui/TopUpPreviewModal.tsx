'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';

export type TopUpPreview = {
  amount: number;
  toDebt: number;
  toDeposit: number;
  tierName: string;
  bonusPercent: number;
  hypotheticBonus: number;
  scheduledAt: string;
  willAccrue: boolean;
  reasonIfNot: string | null;
};

const REASON_LABELS: Record<string, string> = {
  PLATFORM_DISABLED: 'Программа отключена на платформе',
  BRAND_DISABLED: 'Бонусы отключены для бренда',
  BELOW_MINIMUM: 'Сумма меньше минимума для бонуса',
};

export function TopUpPreviewModal({
  open,
  preview,
  onClose,
  onConfirm,
  displayMode = 'FULL',
}: {
  open: boolean;
  preview: TopUpPreview | null;
  onClose: () => void;
  onConfirm: () => void;
  displayMode?: 'NONE' | 'BRIEF' | 'FULL';
}) {
  if (!preview) return null;

  const showLoyalty = displayMode !== 'NONE';

  return (
    <Modal open={open} onClose={onClose} title="Подтверждение пополнения">
      <div className="space-y-3 text-sm">
        <p>Сумма: {preview.amount.toFixed(2)} BYN</p>
        <p>В долг: {preview.toDebt.toFixed(2)} BYN</p>
        <p>На депозит: {preview.toDeposit.toFixed(2)} BYN</p>

        {showLoyalty && (
          <>
            {displayMode === 'FULL' && (
              <p>
                Уровень: {preview.tierName} ({preview.bonusPercent}%)
              </p>
            )}
            {preview.willAccrue ? (
              <p className="text-green-700">
                Бонус {preview.hypotheticBonus} BYN будет начислен{' '}
                {new Date(preview.scheduledAt).toLocaleString('ru-RU')}
              </p>
            ) : (
              <p className="text-amber-700">
                Бонус не начисляется
                {preview.reasonIfNot
                  ? `: ${REASON_LABELS[preview.reasonIfNot] ?? preview.reasonIfNot}`
                  : ''}
                {displayMode === 'FULL' && (
                  <>
                    <br />
                    При включённой программе: {preview.hypotheticBonus} BYN ({preview.bonusPercent}
                    %)
                  </>
                )}
              </p>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onConfirm}>Подтвердить</Button>
        </div>
      </div>
    </Modal>
  );
}
