import { AppShell } from '@/widgets/layout/AppShell';
import { BrandAdminDashboard } from '@/features/brand-admin/ui/BrandAdminDashboard';
import { t } from '@/i18n';

export default function BrandAdminPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t('brandAdmin.pageHeading')}</h1>
          <p className="text-sm text-[rgb(var(--tc-muted))]">{t('brandAdmin.pageSubtitle')}</p>
        </header>

        <BrandAdminDashboard />
      </div>
    </AppShell>
  );
}
