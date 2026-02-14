import { AppShell } from '@/widgets/layout/AppShell';
import { CafeAdminDashboard } from '@/features/cafe-admin/ui/CafeAdminDashboard';

export default function CafeAdminPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl">
        <CafeAdminDashboard />
      </div>
    </AppShell>
  );
}
