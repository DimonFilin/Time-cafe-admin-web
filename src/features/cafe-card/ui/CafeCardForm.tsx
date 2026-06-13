'use client';

import { useState } from 'react';
import { CafeCardTabs, type CafeCardTab } from './CafeCardTabs';
import { CafeMainTabFields } from './CafeMainTabFields';
import { CafeAdditionalTabFields } from './CafeAdditionalTabFields';
import { validateCafeCardFields } from '../lib/cafe-validators';
import type {
  BrandOption,
  CafeCardFormValues,
  CafeCardVariant,
  RegionOption,
} from '../types/cafe-card.types';
import { SCHEDULE_DAYS, SCHEDULE_DAY_LABELS } from '@/features/cafe-admin/cafe/lib/schedule-map';

type Props = {
  variant: CafeCardVariant;
  mode: 'create' | 'edit';
  values: CafeCardFormValues;
  onChange: (values: CafeCardFormValues) => void;
  cafeId?: string;
  regions?: RegionOption[];
  brands?: BrandOption[];
  readOnly?: boolean;
  geocodeSlot?: React.ReactNode;
  formId?: string;
  onSubmit?: () => void;
};

function validateSchedule(values: CafeCardFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const day of SCHEDULE_DAYS) {
    const d = values.schedule[day];
    if (!d.isClosed && d.open >= d.close) {
      errors.schedule = `${SCHEDULE_DAY_LABELS[day]}: время открытия должно быть раньше закрытия`;
      break;
    }
  }
  return errors;
}

export function CafeCardForm({
  variant,
  mode,
  values,
  onChange,
  cafeId,
  regions,
  brands,
  readOnly = false,
  geocodeSlot,
  formId,
  onSubmit,
}: Props) {
  const [tab, setTab] = useState<CafeCardTab>('main');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const patch = (p: Partial<CafeCardFormValues>) => onChange({ ...values, ...p });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      ...validateCafeCardFields(values),
      ...validateSchedule(values),
    };
    if (variant !== 'cafe-admin' && !values.regionId.trim()) {
      errors.regionId = 'Выберите регион';
    }
    if (variant === 'system' && mode === 'create' && !values.brandId.trim()) {
      errors.brandId = 'Выберите бренд';
    }
    if (!values.address.trim()) errors.address = 'Укажите адрес';
    if (!values.city.trim()) errors.city = 'Укажите город';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.schedule) setTab('additional');
      else setTab('main');
      return;
    }
    onSubmit?.();
  };

  const body = (
    <>
      <CafeCardTabs active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === 'main' ? (
          <CafeMainTabFields
            variant={variant}
            values={values}
            onChange={patch}
            errors={fieldErrors}
            regions={regions}
            brands={brands}
            readOnly={readOnly}
            geocodeSlot={geocodeSlot}
          />
        ) : (
          <CafeAdditionalTabFields
            values={values}
            onChange={patch}
            cafeId={cafeId}
            readOnly={readOnly}
          />
        )}
      </div>
    </>
  );

  if (readOnly) return <div className="space-y-4">{body}</div>;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {body}
    </form>
  );
}
