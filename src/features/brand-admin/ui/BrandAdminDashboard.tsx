'use client';

import { useState, useEffect } from 'react';
import { BrandOverviewTab } from '../overview/ui/BrandOverviewTab';
import { CafesTab } from '../cafes/ui/CafesTab';
import { DocumentsTab } from '../documents/ui/DocumentsTab';
import { WorkersTab } from '../workers/ui/WorkersTab';
import { SettingsTab } from '../settings/ui/SettingsTab';
import { AnalyticsTab } from '../analytics/ui/AnalyticsTab';
import { ActivityLogsTab } from '../activity-logs/ui/ActivityLogsTab';
import { BrandMenuTab } from '../menu/ui/BrandMenuTab';
import { ChatsTab } from '@/features/chats/ui/ChatsTab';
import { CafeLayoutEditorTab } from '@/features/layout/ui/CafeLayoutEditorTab';
import { chatsApi } from '@/features/chats/api/chats-api';
import { logWorkerActivity } from '@/shared/lib/log-worker-activity';
import {
  ActivityAction,
  ActivityCategory,
} from '@/features/brand-admin/activity-logs/api/activity-logs-api';
import type { ActivityLogsPreselectedWorker } from '@/shared/lib/activity-logs-worker-bridge';
import {
  SWITCH_TO_ACTIVITY_LOGS_EVENT,
  type SwitchToActivityLogsDetail,
} from '@/shared/lib/activity-logs-worker-bridge';

type TabId =
  | 'overview'
  | 'cafes'
  | 'menu'
  | 'chats'
  | 'documents'
  | 'workers'
  | 'settings'
  | 'analytics'
  | 'layout'
  | 'activity-logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Бренды' },
  { id: 'cafes', label: 'Кафе' },
  { id: 'menu', label: 'Меню' },
  { id: 'chats', label: 'Чаты' },
  { id: 'documents', label: 'Документы' },
  { id: 'workers', label: 'Работники' },
  { id: 'settings', label: 'Настройки' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'layout', label: 'Планировка' },
  { id: 'activity-logs', label: 'Логи активности' },
];

export function BrandAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [workersOpenInvite, setWorkersOpenInvite] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [activityLogsWorker, setActivityLogsWorker] =
    useState<ActivityLogsPreselectedWorker | null>(null);
  const [activityLogsSeed, setActivityLogsSeed] = useState(0);

  useEffect(() => {
    const handleSwitchToActivityLogs = (e: Event) => {
      const detail = (e as CustomEvent<SwitchToActivityLogsDetail>).detail;
      setActiveTab('activity-logs');
      if (detail?.worker) {
        setActivityLogsWorker(detail.worker);
        setActivityLogsSeed((s) => s + 1);
      } else if (detail?.workerId) {
        setActivityLogsWorker({
          id: detail.workerId,
          email: '',
          firstName: '',
          lastName: '',
        });
        setActivityLogsSeed((s) => s + 1);
      }
    };

    const handleSwitchTab = (e: CustomEvent<{ tab: string; openInvite?: boolean }>) => {
      const { tab, openInvite } = e.detail;
      setActiveTab(tab as TabId);
      if (openInvite) setWorkersOpenInvite(true);
    };

    window.addEventListener(SWITCH_TO_ACTIVITY_LOGS_EVENT, handleSwitchToActivityLogs);
    window.addEventListener('brandAdminSwitchTab', handleSwitchTab as EventListener);

    return () => {
      window.removeEventListener(SWITCH_TO_ACTIVITY_LOGS_EVENT, handleSwitchToActivityLogs);
      window.removeEventListener('brandAdminSwitchTab', handleSwitchTab as EventListener);
    };
  }, []);

  useEffect(() => {
    logWorkerActivity({
      action: ActivityAction.TAB_SWITCH,
      category: ActivityCategory.VIEW,
      resourceType: 'BRAND_ADMIN_DASHBOARD',
      details: { tab: activeTab },
    });
  }, [activeTab]);

  useEffect(() => {
    if (!workersOpenInvite) return;
    logWorkerActivity({
      action: ActivityAction.MODAL_OPEN,
      category: ActivityCategory.VIEW,
      resourceType: 'MODAL',
      details: { modalId: 'brand-invite-worker' },
    });
  }, [workersOpenInvite]);

  useEffect(() => {
    const refreshUnread = async () => {
      try {
        const data = await chatsApi.list({ unreadOnly: true, limit: 1 });
        setUnreadChatsCount(data.total || 0);
      } catch {
        // noop
      }
    };
    void refreshUnread();
    const timer = setInterval(() => void refreshUnread(), 15000);
    return () => clearInterval(timer);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <BrandOverviewTab />;
      case 'cafes':
        return <CafesTab />;
      case 'menu':
        return <BrandMenuTab />;
      case 'chats':
        return <ChatsTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'workers':
        return (
          <WorkersTab
            initialOpenInvite={workersOpenInvite}
            onInviteHandled={() => setWorkersOpenInvite(false)}
          />
        );
      case 'settings':
        return <SettingsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'layout':
        return <CafeLayoutEditorTab scope="brand-admin" />;
      case 'activity-logs':
        return (
          <ActivityLogsTab preselectedWorker={activityLogsWorker} selectionKey={activityLogsSeed} />
        );
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
              {tab.id === 'chats' && unreadChatsCount > 0
                ? `${tab.label} (${unreadChatsCount})`
                : tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="w-full">{renderTab()}</div>
    </div>
  );
}
