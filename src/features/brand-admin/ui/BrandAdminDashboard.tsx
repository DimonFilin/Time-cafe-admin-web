'use client';

import { useState, useEffect } from 'react';
import { BrandOverviewTab } from '../overview/ui/BrandOverviewTab';
import { CafesTab } from '../cafes/ui/CafesTab';
import { DocumentsTab } from '../documents/ui/DocumentsTab';
import { WorkersTab } from '../workers/ui/WorkersTab';
import { ApiKeysTab } from '../api-keys/ui/ApiKeysTab';
import { SettingsTab } from '../settings/ui/SettingsTab';
import { AnalyticsTab } from '../analytics/ui/AnalyticsTab';
import { ActivityLogsTab } from '../activity-logs/ui/ActivityLogsTab';

type TabId =
  | 'overview'
  | 'cafes'
  | 'documents'
  | 'workers'
  | 'api-keys'
  | 'settings'
  | 'analytics'
  | 'activity-logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'cafes', label: 'Cafes' },
  { id: 'documents', label: 'Documents' },
  { id: 'workers', label: 'Workers' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'settings', label: 'Settings' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'activity-logs', label: 'Activity Logs' },
];

export function BrandAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [brandId, setBrandId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user to extract brandId
    const fetchBrandId = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setBrandId(data.brandId);
        }
      } catch (e) {
        console.error('Failed to fetch brandId:', e);
      }
    };

    fetchBrandId();

    // Listen for tab switch events from Workers tab
    const handleSwitchToActivityLogs = () => {
      setActiveTab('activity-logs');
    };

    window.addEventListener('switchToActivityLogs', handleSwitchToActivityLogs as EventListener);

    return () => {
      window.removeEventListener(
        'switchToActivityLogs',
        handleSwitchToActivityLogs as EventListener,
      );
    };
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <BrandOverviewTab />;
      case 'cafes':
        return <CafesTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'workers':
        return <WorkersTab />;
      case 'api-keys':
        return brandId ? (
          <ApiKeysTab brandId={brandId} />
        ) : (
          <div className="text-center text-[rgb(var(--tc-muted))]">Loading...</div>
        );
      case 'settings':
        return <SettingsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'activity-logs':
        return <ActivityLogsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab selector */}
      <div className="border-b border-[rgb(var(--tc-border))]">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-[rgb(var(--tc-accent))] text-[rgb(var(--tc-accent))]'
                  : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="w-full">{renderTab()}</div>
    </div>
  );
}
