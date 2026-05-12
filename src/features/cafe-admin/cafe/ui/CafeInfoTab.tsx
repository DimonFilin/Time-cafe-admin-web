'use client';

import { useState, useEffect } from 'react';
import { t } from '@/i18n';
import { getMyCafe, updateMyCafe } from '../api/cafe-api';
import { Cafe } from '../types/cafe.types';
import { EditCafeModal } from './EditCafeModal';
import { EditScheduleModal } from './EditScheduleModal';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { SCHEDULE_DAYS, SCHEDULE_DAY_LABELS } from '../lib/schedule-map';

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-[rgb(var(--tc-muted))]">{label}</div>
      <div className="mt-1 text-sm text-[rgb(var(--tc-fg))]">{children}</div>
    </div>
  );
}

export function CafeInfoTab() {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [savingChatSettings, setSavingChatSettings] = useState(false);

  const loadCafe = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyCafe();
      setCafe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cafeAdmin.cafeInfo.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCafe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm text-[rgb(var(--tc-muted))]">
          {t('cafeAdmin.cafeInfo.loadingCafeInfo')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={loadCafe}>
          {t('cafeAdmin.cafeInfo.retry')}
        </Button>
      </Card>
    );
  }

  if (!cafe) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[rgb(var(--tc-muted))]">{t('cafeAdmin.cafeInfo.noCafeInfo')}</p>
      </Card>
    );
  }

  const brandLabel = cafe.brandName?.trim() || cafe.brandId;
  const regionLabel = cafe.regionName?.trim() || cafe.regionId;
  const savedSchedule = cafe.schedule;
  const chatSettings = cafe.chatSettings;

  const saveChatSettings = async (payload: {
    chatEnabled?: boolean;
    chatNotificationMode?: 'ALL_WORKERS' | 'ROLE_BASED' | 'SPECIFIC_WORKERS';
    chatThemePrimaryColor?: string;
  }) => {
    try {
      setSavingChatSettings(true);
      await updateMyCafe(payload);
      await loadCafe();
    } finally {
      setSavingChatSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t('cafeAdmin.cafeInfo.title')}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
          {t('cafeAdmin.cafeInfo.subtitle')}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">{cafe.name}</h3>
            <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
              {cafe.address}, {cafe.city}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsScheduleModalOpen(true)}>
              {t('cafeAdmin.cafeInfo.editSchedule')}
            </Button>
            <Button type="button" variant="primary" onClick={() => setIsEditModalOpen(true)}>
              {t('cafeAdmin.cafeInfo.editInformation')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold">{t('cafeAdmin.cafeInfo.basicInformation')}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label={t('cafeAdmin.cafeInfo.name')}>{cafe.name}</InfoField>
          <InfoField label={t('cafeAdmin.cafeInfo.brand')}>{brandLabel}</InfoField>
          <InfoField label={t('cafeAdmin.cafeInfo.region')}>{regionLabel}</InfoField>
          <InfoField label={t('cafeAdmin.cafeInfo.rating')}>
            {cafe.rating.toFixed(1)} ({cafe.reviewsCount})
          </InfoField>
          {cafe.description ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <InfoField label={t('cafeAdmin.cafeInfo.description')}>{cafe.description}</InfoField>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold">{t('cafeAdmin.cafeInfo.openingHours')}</h3>
        {savedSchedule ? (
          <ul className="divide-y divide-[rgb(var(--tc-border))] rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] text-sm">
            {SCHEDULE_DAYS.map((day) => {
              const d = savedSchedule[day];
              return (
                <li
                  key={day}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-medium text-[rgb(var(--tc-fg))]">
                    {SCHEDULE_DAY_LABELS[day]}
                  </span>
                  <span className="text-[rgb(var(--tc-muted))]">
                    {d.isClosed ? t('cafeAdmin.cafeInfo.closed') : `${d.open} – ${d.close}`}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            {t('cafeAdmin.cafeInfo.noSchedule')}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold">{t('cafeAdmin.cafeInfo.chatSettings')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField label={t('cafeAdmin.cafeInfo.chatStatus')}>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                chatSettings?.enabled === false
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {chatSettings?.enabled === false
                ? t('cafeAdmin.cafeInfo.disabled')
                : t('cafeAdmin.cafeInfo.enabled')}
            </span>
          </InfoField>
          <InfoField label={t('cafeAdmin.cafeInfo.notificationMode')}>
            {chatSettings?.notificationMode || 'ALL_WORKERS'}
          </InfoField>
          <InfoField label={t('cafeAdmin.cafeInfo.themePrimaryColor')}>
            {chatSettings?.theme?.primaryColor || t('cafeAdmin.cafeInfo.brandCafeDefault')}
          </InfoField>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={savingChatSettings}
            onClick={() =>
              void saveChatSettings({
                chatEnabled: !(chatSettings?.enabled ?? true),
              })
            }
          >
            {chatSettings?.enabled === false
              ? t('cafeAdmin.cafeInfo.enableChat')
              : t('cafeAdmin.cafeInfo.disableChat')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={savingChatSettings}
            onClick={() =>
              void saveChatSettings({
                chatNotificationMode:
                  chatSettings?.notificationMode === 'ROLE_BASED' ? 'ALL_WORKERS' : 'ROLE_BASED',
              })
            }
          >
            {t('cafeAdmin.cafeInfo.toggleRoleBasedNotifications')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={savingChatSettings}
            onClick={() =>
              void saveChatSettings({
                chatThemePrimaryColor:
                  chatSettings?.theme?.primaryColor === '#22c55e' ? '' : '#22c55e',
              })
            }
          >
            {t('cafeAdmin.cafeInfo.toggleGreenChatAccent')}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold">
          {t('cafeAdmin.cafeInfo.addressIntegration')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField label={t('cafeAdmin.cafeInfo.streetAddress')}>{cafe.address}</InfoField>
          <InfoField label={t('cafeAdmin.cafeInfo.city')}>{cafe.city}</InfoField>
          {cafe.street ? (
            <InfoField label={t('cafeAdmin.cafeInfo.street')}>{cafe.street}</InfoField>
          ) : null}
          {typeof cafe.latitude === 'number' && typeof cafe.longitude === 'number' ? (
            <InfoField label={t('cafeAdmin.cafeInfo.coordinates')}>
              {cafe.latitude.toFixed(6)}, {cafe.longitude.toFixed(6)}
            </InfoField>
          ) : null}
          {cafe.cafeApiUrl ? (
            <div className="sm:col-span-2">
              <InfoField label={t('cafeAdmin.cafeInfo.cafeApiUrl')}>{cafe.cafeApiUrl}</InfoField>
            </div>
          ) : null}
        </div>
      </Card>

      <EditCafeModal
        open={isEditModalOpen}
        cafe={cafe}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadCafe();
        }}
      />

      <EditScheduleModal
        open={isScheduleModalOpen}
        cafe={cafe}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => {
          setIsScheduleModalOpen(false);
          loadCafe();
        }}
      />
    </div>
  );
}
