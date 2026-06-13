'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';
import { CafeCardForm } from '@/features/cafe-card/ui/CafeCardForm';
import { createEmptyCafeCardValues } from '@/features/cafe-card/lib/defaults';
import { cafeRecordToCardValues } from '@/features/cafe-card/lib/map-from-cafe';
import { cafeCardToApiPayload } from '@/features/cafe-card/lib/map-to-api';
import type { CafeCardFormValues } from '@/features/cafe-card/types/cafe-card.types';
import type { Brand } from '@/entities/brand/types/brand';
import type { Region } from '@/entities/region/types/region';
import { t } from '@/i18n';

type Props = {
  open: boolean;
  editId: string | null;
  brands: Brand[];
  regions: Region[];
  defaultBrandId?: string;
  onClose: () => void;
  onSave: (
    payload: ReturnType<typeof cafeCardToApiPayload>,
    editId: string | null,
  ) => Promise<void>;
  geocodeSlot: (
    values: CafeCardFormValues,
    setValues: (v: CafeCardFormValues) => void,
  ) => React.ReactNode;
};

export function SystemCafeFormModal({
  open,
  editId,
  brands,
  regions,
  defaultBrandId,
  onClose,
  onSave,
  geocodeSlot,
}: Props) {
  const [values, setValues] = useState<CafeCardFormValues>(() => createEmptyCafeCardValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const load = async () => {
      if (editId) {
        const res = await fetch(`/api/system-admin/cafes/${editId}`, { cache: 'no-store' });
        if (res.ok) {
          setValues(cafeRecordToCardValues(await res.json()));
          return;
        }
      }
      setValues(
        createEmptyCafeCardValues({
          brandId: defaultBrandId ?? '',
          regionId: regions[0]?.id ?? '',
        }),
      );
    };
    void load();
  }, [open, editId, defaultBrandId, regions]);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSave(cafeCardToApiPayload(values), editId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={editId ? t('systemAdmin.cafes.editCafeModal') : t('systemAdmin.cafes.createCafeModal')}
      onClose={onClose}
      size="2xl"
    >
      {error ? (
        <Card className="mb-3 p-3 text-sm text-[rgb(var(--tc-danger))]">{error}</Card>
      ) : null}
      <CafeCardForm
        variant="system"
        mode={editId ? 'edit' : 'create'}
        values={values}
        onChange={setValues}
        cafeId={editId ?? undefined}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        regions={regions.map((r) => ({ id: r.id, name: r.name, country: r.country }))}
        geocodeSlot={geocodeSlot(values, setValues)}
        formId="system-cafe-form"
        onSubmit={() => void submit()}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" form="system-cafe-form" disabled={loading}>
          {loading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </Modal>
  );
}
