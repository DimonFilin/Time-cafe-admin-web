import { LoyaltyAdmin } from '@/features/system-admin/loyalty/ui/LoyaltyAdmin';

export default function LoyaltyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Лояльность</h1>
      <LoyaltyAdmin />
    </div>
  );
}
