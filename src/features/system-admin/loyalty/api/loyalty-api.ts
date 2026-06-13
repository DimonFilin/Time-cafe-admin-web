'use client';

async function readError(res: Response) {
  const json = await res.json().catch(() => ({}));
  return (json as { message?: string }).message || res.statusText;
}

export type PlatformLoyaltySettings = {
  id: string;
  enabled: boolean;
  accrualDelayHours: number;
  minTopUpForBonus: string;
  tierPercentChangeCooldownHours: number;
  timezone: string;
};

export type LoyaltyTier = {
  id: string;
  name: string;
  bonusPercent: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
};

export async function getLoyaltySettings(): Promise<PlatformLoyaltySettings> {
  const res = await fetch('/api/system-admin/loyalty/settings', { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function updateLoyaltySettings(
  data: Partial<PlatformLoyaltySettings>,
): Promise<PlatformLoyaltySettings> {
  const res = await fetch('/api/system-admin/loyalty/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function listTiers(): Promise<LoyaltyTier[]> {
  const res = await fetch('/api/system-admin/loyalty/tiers', { cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createTier(data: {
  name: string;
  bonusPercent: number;
}): Promise<LoyaltyTier> {
  const res = await fetch('/api/system-admin/loyalty/tiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function updateTier(
  id: string,
  data: { name?: string; bonusPercent?: number; isActive?: boolean },
): Promise<LoyaltyTier> {
  const res = await fetch(`/api/system-admin/loyalty/tiers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function reorderTiers(orderedIds: string[]): Promise<LoyaltyTier[]> {
  const res = await fetch('/api/system-admin/loyalty/tiers/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function deactivateTier(id: string, migrateToTierId: string): Promise<LoyaltyTier> {
  const res = await fetch(`/api/system-admin/loyalty/tiers/${id}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ migrateToTierId }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
