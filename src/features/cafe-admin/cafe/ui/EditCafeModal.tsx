'use client';

import { useEffect, useState } from 'react';
import { updateMyCafe, updateCafeSchedule } from '../api/cafe-api';
import { Cafe, UpdateCafeDto } from '../types/cafe.types';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { CafeCardForm } from '@/features/cafe-card/ui/CafeCardForm';
import { cafeToCardValues } from '@/features/cafe-card/lib/map-from-cafe-admin';
import type { CafeCardFormValues } from '@/features/cafe-card/types/cafe-card.types';
import { t } from '@/i18n';

interface EditCafeModalProps {
  open: boolean;
  cafe: Cafe;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCafeModal({ open, cafe, onClose, onSuccess }: EditCafeModalProps) {
  const [values, setValues] = useState<CafeCardFormValues>(() => cafeToCardValues(cafe));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(cafeToCardValues(cafe));
    setError(null);
  }, [open, cafe]);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload: UpdateCafeDto = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        address: values.address.trim(),
        city: values.city.trim(),
        street: values.street.trim() || undefined,
        latitude: Number(values.latitude) || 0,
        longitude: Number(values.longitude) || 0,
        cafeApiUrl: values.cafeApiUrl.trim() || undefined,
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        occupancyMode: values.occupancyMode,
      };
      await updateMyCafe(payload);
      await updateCafeSchedule(values.schedule);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cafeAdmin.cafeInfo.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('cafeAdmin.cafeInfo.editCafeTitle')}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="edit-cafe-form" disabled={loading}>
            {loading ? t('common.saving') : t('cafeAdmin.cafeInfo.saveChanges')}
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <CafeCardForm
        variant="cafe-admin"
        mode="edit"
        values={values}
        onChange={setValues}
        cafeId={cafe.id}
        formId="edit-cafe-form"
        onSubmit={() => void submit()}
      />
    </Modal>
  );
}
