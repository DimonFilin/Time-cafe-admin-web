'use client';

import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';

export function ConfirmModal({
  open,
  title = 'Подтвердите действие',
  description,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  isDanger,
  isLoading,
  loading,
  onConfirm,
  onClose,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose?: () => void;
  onCancel?: () => void;
}) {
  const handleClose = onCancel || onClose || (() => {});
  const displayMessage = message || description;
  const isActuallyLoading = loading !== undefined ? loading : isLoading;

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      {displayMessage && (
        <div className="text-sm text-[rgb(var(--tc-muted))]">{displayMessage}</div>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={handleClose} disabled={isActuallyLoading}>
          {cancelText}
        </Button>
        <Button
          variant={isDanger ? 'primary' : 'primary'}
          className={
            isDanger ? 'bg-[rgb(var(--tc-danger))] hover:bg-[rgb(var(--tc-danger))]/90' : ''
          }
          onClick={onConfirm}
          disabled={isActuallyLoading}
        >
          {isActuallyLoading ? '...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
