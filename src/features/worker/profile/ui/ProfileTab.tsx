'use client';

import { useEffect, useRef, useState } from 'react';

import { t } from '@/i18n';
import { MediaImage } from '@/shared/ui/media/MediaImage';
import { workerApi } from '../../api/worker-api';
import type { WorkerMeSchedule, WorkerWithRelations } from '../../types/worker.types';
import { WorkerScheduleCard } from '../../ui/WorkerScheduleCard';

interface ProfileTabProps {
  worker: WorkerWithRelations;
  schedule: WorkerMeSchedule | null;
  scheduleLoading: boolean;
  scheduleError: string | null;
  onWorkerUpdated: (worker: WorkerWithRelations) => void;
}

export function ProfileTab({
  worker,
  schedule,
  scheduleLoading,
  scheduleError,
  onWorkerUpdated,
}: ProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(worker.firstName);
  const [lastName, setLastName] = useState(worker.lastName);
  const [birthDate, setBirthDate] = useState(worker.birthDate ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(worker.firstName);
    setLastName(worker.lastName);
    setBirthDate(worker.birthDate ?? '');
  }, [worker.firstName, worker.lastName, worker.birthDate, worker.id]);

  const displayName = `${firstName} ${lastName}`.trim();
  const initials = displayName.slice(0, 1).toUpperCase() || '?';

  const handleAvatarPick = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await workerApi.uploadAvatar(file);
      onWorkerUpdated(updated);
      setSuccess(t('profile.avatarSaved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('profile.saveFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setError(t('profile.nameRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await workerApi.updateProfile({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        birthDate: birthDate.trim() ? birthDate.trim() : null,
      });
      onWorkerUpdated(updated);
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setBirthDate(updated.birthDate ?? '');
      setSuccess(t('profile.saved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t('profile.title')}</h2>
        <p className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.subtitle')}</p>
      </div>

      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">{t('profile.personalInfo')}</h3>
        <p className="mb-4 text-sm text-[rgb(var(--tc-muted))]">{t('profile.publicHint')}</p>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg-soft))] disabled:opacity-60"
              title={t('profile.changeAvatar')}
            >
              {worker.avatarUrl ? (
                <MediaImage
                  src={worker.avatarUrl}
                  alt={displayName}
                  variant="avatarMd"
                  className="!h-20 !w-20"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[rgb(var(--tc-accent))]">
                  {initials}
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void handleAvatarPick(file);
                e.target.value = '';
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.workerRole')}</div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm text-[rgb(var(--tc-accent))] underline disabled:opacity-60"
              >
                {uploading ? t('profile.uploadingAvatar') : t('profile.changeAvatar')}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.firstName')}</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={80}
                className="mt-1 w-full rounded-md border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.lastName')}</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={80}
                className="mt-1 w-full rounded-md border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.birthDate')}</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm"
              />
            </label>
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.cafe')}</div>
              <div className="mt-1 font-medium">
                {worker.cafe?.name || t('profile.notAssigned')}
              </div>
              <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
                {t('profile.cafeReadonly')}
              </p>
            </div>
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.brand')}</div>
              <div className="mt-1 font-medium">
                {worker.brand?.name || t('profile.notAssigned')}
              </div>
            </div>
            <div>
              <div className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.shiftStatus')}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className={worker.shiftStatus === 'ON_SHIFT' ? 'animate-pulse' : ''}>
                  {worker.shiftStatus === 'ON_SHIFT' ? '🟢' : '⚪'}
                </span>
                <span className="font-medium">
                  {worker.shiftStatus === 'ON_SHIFT' ? t('profile.onShift') : t('profile.offShift')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void handleSaveProfile()}
              className="rounded-md bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? t('profile.saving') : t('profile.save')}
            </button>
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
            {success ? <span className="text-sm text-green-700">{success}</span> : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">{t('profile.statistics')}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-4">
            <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">-</div>
            <div className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.ordersToday')}</div>
          </div>
          <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-4">
            <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">-</div>
            <div className="text-sm text-[rgb(var(--tc-muted))]">
              {t('profile.appointmentsToday')}
            </div>
          </div>
          <div className="rounded-lg bg-[rgb(var(--tc-muted))]/5 p-4">
            <div className="text-2xl font-bold text-[rgb(var(--tc-accent))]">-</div>
            <div className="text-sm text-[rgb(var(--tc-muted))]">{t('profile.tasksCompleted')}</div>
          </div>
        </div>
        <p className="mt-4 text-xs text-[rgb(var(--tc-muted))]">
          {t('profile.statisticsComingSoon')}
        </p>
      </div>

      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">{t('profile.schedule')}</h3>
        <p className="mb-4 text-sm text-[rgb(var(--tc-muted))]">{t('profile.scheduleSubtitle')}</p>
        <WorkerScheduleCard
          schedule={schedule}
          loading={scheduleLoading}
          error={scheduleError}
          cafeName={worker.cafe?.name}
        />
      </div>

      <div className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-6">
        <h3 className="mb-4 text-lg font-semibold">{t('profile.notifications')}</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">{t('profile.newOrders')}</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">{t('profile.newAppointments')}</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">{t('profile.taskReminders')}</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">{t('profile.adminMessages')}</span>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </label>
        </div>
        <p className="mt-4 text-xs text-[rgb(var(--tc-muted))]">
          {t('profile.notificationsComingSoon')}
        </p>
      </div>
    </div>
  );
}
