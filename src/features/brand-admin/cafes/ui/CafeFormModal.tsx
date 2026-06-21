'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';
import { CafeCardForm } from '@/features/cafe-card/ui/CafeCardForm';
import { createEmptyCafeCardValues } from '@/features/cafe-card/lib/defaults';
import { cafeRecordToCardValues } from '@/features/cafe-card/lib/map-from-cafe';
import { cafeCardToApiPayload } from '@/features/cafe-card/lib/map-to-api';
import type { CafeCardFormValues } from '@/features/cafe-card/types/cafe-card.types';
import { t } from '@/i18n';

interface Region {
  id: string;
  name: string;
  country: string;
}

interface CafeFormModalProps {
  cafe?: { id?: string } | null;
  regions: Region[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReturnType<typeof cafeCardToApiPayload>) => Promise<void>;
}

export function CafeFormModal({ cafe, regions, isOpen, onClose, onSave }: CafeFormModalProps) {
  const [values, setValues] = useState<CafeCardFormValues>(() => createEmptyCafeCardValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const load = async () => {
      if (cafe?.id) {
        try {
          const res = await fetch(`/api/brand/cafes/${String(cafe.id)}`, { cache: 'no-store' });
          if (res.ok) {
            setValues(cafeRecordToCardValues(await res.json()));
            return;
          }
        } catch {
          /* fallback */
        }
      }
      if (cafe) {
        setValues(cafeRecordToCardValues(cafe as Record<string, unknown>));
      } else {
        setValues(
          createEmptyCafeCardValues({
            regionId: regions[0]?.id ?? '',
          }),
        );
      }
    };
    void load();
  }, [isOpen, cafe, regions]);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSave(cafeCardToApiPayload(values));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brandAdmin.cafes.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title={cafe ? t('brandAdmin.cafes.editCafe') : t('brandAdmin.cafes.newCafe')}
      onClose={onClose}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="brand-cafe-form" disabled={loading}>
            {loading ? t('common.saving') : cafe ? t('common.save') : t('common.create')}
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      ) : null}
      <CafeCardForm
        variant="brand"
        mode={cafe ? 'edit' : 'create'}
        values={values}
        onChange={setValues}
        cafeId={cafe?.id != null ? String(cafe.id) : undefined}
        regions={regions}
        formId="brand-cafe-form"
        onSubmit={() => void submit()}
      />
    </Modal>
  );
}
