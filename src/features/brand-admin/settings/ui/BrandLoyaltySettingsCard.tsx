'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';

type LoyaltySettings = {
  bonusesEnabled: boolean;
  displayMode: 'NONE' | 'BRIEF' | 'FULL';
};

export function BrandLoyaltySettingsCard() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);

  useEffect(() => {
    void fetch('/api/brand/loyalty/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  const save = async (patch: Partial<LoyaltySettings>) => {
    const res = await fetch('/api/brand/loyalty/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) setSettings(await res.json());
  };

  if (!settings) return null;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Лояльность</h3>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.bonusesEnabled}
          onChange={(e) => void save({ bonusesEnabled: e.target.checked })}
        />
        Начислять бонусы от пополнений в наших кафе
      </label>
      <label className="text-sm block">
        Отображение для сотрудников
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={settings.displayMode}
          onChange={(e) =>
            void save({
              displayMode: e.target.value as LoyaltySettings['displayMode'],
            })
          }
        >
          <option value="NONE">Не показывать</option>
          <option value="BRIEF">Кратко</option>
          <option value="FULL">Полностью</option>
        </select>
      </label>
    </Card>
  );
}
