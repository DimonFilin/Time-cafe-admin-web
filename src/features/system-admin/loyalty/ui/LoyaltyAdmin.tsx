'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';
import {
  createTier,
  deactivateTier,
  getLoyaltySettings,
  listTiers,
  reorderTiers,
  updateLoyaltySettings,
  updateTier,
  type LoyaltyTier,
  type PlatformLoyaltySettings,
} from '../api/loyalty-api';

export function LoyaltyAdmin() {
  const [settings, setSettings] = useState<PlatformLoyaltySettings | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierError, setTierError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPercent, setNewPercent] = useState('8');

  const [editTier, setEditTier] = useState<LoyaltyTier | null>(null);
  const [editName, setEditName] = useState('');
  const [editPercent, setEditPercent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTier, setDeleteTier] = useState<LoyaltyTier | null>(null);
  const [migrateToId, setMigrateToId] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortedTiers = useMemo(() => [...tiers].sort((a, b) => a.sortOrder - b.sortOrder), [tiers]);

  const activeTiers = useMemo(() => sortedTiers.filter((t) => t.isActive), [sortedTiers]);

  const load = async () => {
    setLoading(true);
    setTierError(null);
    try {
      const [s, t] = await Promise.all([getLoyaltySettings(), listTiers()]);
      setSettings(s);
      setTiers(t);
    } catch (e) {
      setTierError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const moveTier = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= activeTiers.length) return;
    const ids = activeTiers.map((t) => t.id);
    const swapped = [...ids];
    [swapped[index], swapped[nextIndex]] = [swapped[nextIndex], swapped[index]];
    setTierError(null);
    try {
      const updated = await reorderTiers(swapped);
      setTiers(updated);
    } catch (e) {
      setTierError(e instanceof Error ? e.message : String(e));
    }
  };

  const openEdit = (tier: LoyaltyTier) => {
    setEditTier(tier);
    setEditName(tier.name);
    setEditPercent(String(Number(tier.bonusPercent)));
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editTier) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateTier(editTier.id, {
        name: editName.trim(),
        bonusPercent: Number(editPercent),
      });
      setEditTier(null);
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditSaving(false);
    }
  };

  const openDelete = (tier: LoyaltyTier) => {
    const others = activeTiers.filter((t) => t.id !== tier.id);
    setDeleteTier(tier);
    setMigrateToId(others[0]?.id ?? '');
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTier || !migrateToId) return;
    setDeleteSaving(true);
    setDeleteError(null);
    try {
      await deactivateTier(deleteTier.id, migrateToId);
      setDeleteTier(null);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleteSaving(false);
    }
  };

  if (loading || !settings) {
    return <p className="text-sm text-[rgb(var(--tc-muted))]">Загрузка…</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Платформа</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) =>
              void updateLoyaltySettings({ enabled: e.target.checked }).then(setSettings)
            }
          />
          Программа лояльности включена
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Задержка начисления (часы)
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              type="number"
              value={settings.accrualDelayHours}
              onChange={(e) =>
                setSettings({ ...settings, accrualDelayHours: Number(e.target.value) })
              }
              onBlur={() => void updateLoyaltySettings(settings).then(setSettings)}
            />
          </label>
          <label className="text-sm">
            Мин. пополнение для бонуса (BYN)
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              type="number"
              value={Number(settings.minTopUpForBonus)}
              onChange={(e) => setSettings({ ...settings, minTopUpForBonus: e.target.value })}
              onBlur={() => void updateLoyaltySettings(settings).then(setSettings)}
            />
          </label>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Уровни</h2>
        {tierError && <p className="text-sm text-[rgb(var(--tc-danger))]">{tierError}</p>}
        <ul className="space-y-2">
          {activeTiers.map((t, index) => (
            <li
              key={t.id}
              className="flex items-center gap-2 text-sm border border-[rgb(var(--tc-border))] rounded-lg px-3 py-2"
            >
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  className="rounded border px-1.5 text-xs disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => void moveTier(index, -1)}
                  aria-label="Выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded border px-1.5 text-xs disabled:opacity-30"
                  disabled={index === activeTiers.length - 1}
                  onClick={() => void moveTier(index, 1)}
                  aria-label="Ниже"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {t.name}
                  {t.isDefault ? ' (по умолчанию)' : ''}
                </div>
                <div className="text-xs text-[rgb(var(--tc-muted))]">Порядок: {t.sortOrder}</div>
              </div>
              <span className="font-mono shrink-0">{Number(t.bonusPercent)}%</span>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs hover:bg-[rgb(var(--tc-border))]/30"
                onClick={() => openEdit(t)}
                aria-label="Редактировать"
              >
                ✎
              </button>
              {!t.isDefault && (
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs text-[rgb(var(--tc-danger))] hover:bg-red-50"
                  onClick={() => openDelete(t)}
                  aria-label="Удалить"
                >
                  🗑
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Название"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm w-20"
            type="number"
            value={newPercent}
            onChange={(e) => setNewPercent(e.target.value)}
          />
          <Button
            onClick={() =>
              void createTier({
                name: newName,
                bonusPercent: Number(newPercent),
              }).then(() => {
                setNewName('');
                void load();
              })
            }
          >
            Добавить уровень
          </Button>
        </div>
      </Card>

      <Modal open={!!editTier} title="Редактировать уровень" onClose={() => setEditTier(null)}>
        <div className="grid gap-3">
          {editError && <p className="text-sm text-[rgb(var(--tc-danger))]">{editError}</p>}
          <label className="text-sm">
            Название
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Бонус (%)
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              type="number"
              value={editPercent}
              onChange={(e) => setEditPercent(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="secondary" onClick={() => setEditTier(null)} disabled={editSaving}>
              Отмена
            </Button>
            <Button onClick={() => void saveEdit()} disabled={editSaving}>
              {editSaving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTier} title="Удалить уровень" onClose={() => setDeleteTier(null)}>
        <div className="grid gap-3">
          {deleteError && <p className="text-sm text-[rgb(var(--tc-danger))]">{deleteError}</p>}
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Гости уровня «{deleteTier?.name}» будут переведены на другой уровень.
          </p>
          <label className="text-sm">
            Перевести на
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={migrateToId}
              onChange={(e) => setMigrateToId(e.target.value)}
            >
              {activeTiers
                .filter((t) => t.id !== deleteTier?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({Number(t.bonusPercent)}%)
                  </option>
                ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="secondary" onClick={() => setDeleteTier(null)} disabled={deleteSaving}>
              Отмена
            </Button>
            <Button onClick={() => void confirmDelete()} disabled={deleteSaving || !migrateToId}>
              {deleteSaving ? 'Удаление…' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
