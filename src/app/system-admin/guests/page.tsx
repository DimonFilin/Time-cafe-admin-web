import { GuestsAdmin } from '@/features/system-admin/guests/ui/GuestsAdmin';

export default function GuestsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Клиенты сети</h1>
      <GuestsAdmin />
    </div>
  );
}
