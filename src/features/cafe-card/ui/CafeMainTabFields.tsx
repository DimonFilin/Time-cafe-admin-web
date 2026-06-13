'use client';

import { Input } from '@/shared/ui/input/Input';
import { formatPhoneInput } from '../lib/cafe-validators';
import type {
  BrandOption,
  CafeCardFormValues,
  CafeCardVariant,
  RegionOption,
} from '../types/cafe-card.types';
import { t } from '@/i18n';

const labelClass = 'mb-1 block text-xs font-medium text-[rgb(var(--tc-muted))]';
const fieldClass =
  'w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]';

type Props = {
  variant: CafeCardVariant;
  values: CafeCardFormValues;
  onChange: (patch: Partial<CafeCardFormValues>) => void;
  errors: Record<string, string>;
  regions?: RegionOption[];
  brands?: BrandOption[];
  readOnly?: boolean;
  geocodeSlot?: React.ReactNode;
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function CafeMainTabFields({
  variant,
  values,
  onChange,
  errors,
  regions = [],
  brands = [],
  readOnly = false,
  geocodeSlot,
}: Props) {
  if (readOnly) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className={labelClass}>Название</div>
          <p className="text-sm">{values.name}</p>
        </div>
        <div>
          <div className={labelClass}>Адрес</div>
          <p className="text-sm">
            {values.address}
            {values.city ? `, ${values.city}` : ''}
          </p>
        </div>
        <div>
          <div className={labelClass}>Телефон</div>
          <p className="text-sm">{values.phone || '—'}</p>
        </div>
        <div>
          <div className={labelClass}>{t('common.email')}</div>
          <p className="text-sm">{values.email || '—'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Название" required error={errors.name}>
        <Input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Кофейня на Тверской"
        />
      </Field>

      <Field label="Адрес" required error={errors.address}>
        <input
          className={fieldClass}
          value={values.address}
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Город" required error={errors.city}>
          <input
            className={fieldClass}
            value={values.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </Field>

        {variant !== 'cafe-admin' && (
          <Field label="Регион" required error={errors.regionId}>
            <select
              className={fieldClass}
              value={values.regionId}
              onChange={(e) => onChange({ regionId: e.target.value })}
            >
              <option value="">Выберите регион</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}, {r.country}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {variant === 'system' && (
        <Field label="Бренд" required error={errors.brandId}>
          <select
            className={fieldClass}
            value={values.brandId}
            onChange={(e) => onChange({ brandId: e.target.value })}
          >
            <option value="">Выберите бренд</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Улица">
        <input
          className={fieldClass}
          value={values.street}
          onChange={(e) => onChange({ street: e.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Телефон" error={errors.phone}>
          <input
            className={fieldClass}
            value={values.phone}
            placeholder="+375-29-123-45-67"
            onChange={(e) => onChange({ phone: formatPhoneInput(e.target.value) })}
          />
        </Field>
        <Field label={t('common.email')} error={errors.email}>
          <input
            className={fieldClass}
            type="email"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </Field>
      </div>

      {(variant === 'system' || variant === 'brand') && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Широта">
              <input
                className={fieldClass}
                type="number"
                step="any"
                value={values.latitude}
                onChange={(e) => onChange({ latitude: e.target.value })}
              />
            </Field>
            <Field label="Долгота">
              <input
                className={fieldClass}
                type="number"
                step="any"
                value={values.longitude}
                onChange={(e) => onChange({ longitude: e.target.value })}
              />
            </Field>
          </div>
          {geocodeSlot}
        </>
      )}

      {variant === 'system' && (
        <>
          <Field label="Описание">
            <textarea
              className={`${fieldClass} min-h-[80px]`}
              value={values.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </Field>
          <Field label="Фото (URL, по одному на строку)">
            <textarea
              className={`${fieldClass} min-h-[80px] font-mono text-xs`}
              value={values.photosText}
              onChange={(e) => onChange({ photosText: e.target.value })}
            />
          </Field>
        </>
      )}

      {(variant === 'cafe-admin' || variant === 'brand') && (
        <Field label="Описание">
          <textarea
            className={`${fieldClass} min-h-[80px]`}
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
      )}

      {(variant === 'cafe-admin' || variant === 'system') && (
        <Field label={t('cafeAdmin.cafeInfo.cafeApiUrl')}>
          <input
            className={fieldClass}
            value={values.cafeApiUrl}
            onChange={(e) => onChange({ cafeApiUrl: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
