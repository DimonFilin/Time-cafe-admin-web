import { AppShell } from '@/widgets/layout/AppShell';
import { BrandAdminDashboard } from '@/features/brand-admin/ui/BrandAdminDashboard';

export default function BrandAdminPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Brand Admin</h1>
          <p className="text-sm text-[rgb(var(--tc-muted))]">
            Manage your brand profile, cafes, documents, team, API keys, and more.
          </p>
        </header>

        <BrandAdminDashboard />
      </div>
    </AppShell>
  );
}
