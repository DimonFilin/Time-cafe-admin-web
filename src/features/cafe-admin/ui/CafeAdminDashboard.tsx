'use client';

import { useState, useEffect } from 'react';
import { WorkersTab } from '../workers/ui/WorkersTab';
import { TasksTab } from '../tasks/ui/TasksTab';
import { ActivityLogsTab } from '../activity-logs/ui/ActivityLogsTab';
import { OverviewTab } from '../overview/ui/OverviewTab';
import { CafeInfoTab } from '../cafe/ui/CafeInfoTab';
import { MenuTab } from '../menu/ui/MenuTab';
import { ChatsTab } from '@/features/chats/ui/ChatsTab';
import { CafeLayoutEditorTab } from '@/features/layout/ui/CafeLayoutEditorTab';
import { chatsApi } from '@/features/chats/api/chats-api';
import { t } from '@/i18n';
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
  | 'workers'
  | 'tasks'
  | 'menu'
  | 'chats'
  | 'cafe-info'
  | 'layout'
  | 'activity-logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: t('dashboard.overview') },
  { id: 'workers', label: t('dashboard.workers') },
  { id: 'tasks', label: t('dashboard.tasks') },
  { id: 'menu', label: t('dashboard.menu') },
  { id: 'chats', label: t('dashboard.chats') },
  { id: 'cafe-info', label: t('dashboard.cafeInfo') },
  { id: 'layout', label: t('dashboard.layout') },
  { id: 'activity-logs', label: t('dashboard.activityLogs') },
];

export function CafeAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [workersOpenInvite, setWorkersOpenInvite] = useState(false);
  const [tasksOpenCreate, setTasksOpenCreate] = useState(false);
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

    const handleSwitchTab = (
      e: CustomEvent<{ tab: string; openInvite?: boolean; openCreate?: boolean }>,
    ) => {
      const { tab, openInvite, openCreate } = e.detail;
      setActiveTab(tab as TabId);
      if (openInvite) setWorkersOpenInvite(true);
      if (openCreate) setTasksOpenCreate(true);
    };

    window.addEventListener(SWITCH_TO_ACTIVITY_LOGS_EVENT, handleSwitchToActivityLogs);
    window.addEventListener('cafeAdminSwitchTab', handleSwitchTab as EventListener);

    return () => {
      window.removeEventListener(SWITCH_TO_ACTIVITY_LOGS_EVENT, handleSwitchToActivityLogs);
      window.removeEventListener('cafeAdminSwitchTab', handleSwitchTab as EventListener);
    };
  }, []);

  useEffect(() => {
    logWorkerActivity({
      action: ActivityAction.TAB_SWITCH,
      category: ActivityCategory.VIEW,
      resourceType: 'CAFE_ADMIN_DASHBOARD',
      details: { tab: activeTab },
    });
  }, [activeTab]);

  useEffect(() => {
    if (!workersOpenInvite) return;
    logWorkerActivity({
      action: ActivityAction.MODAL_OPEN,
      category: ActivityCategory.VIEW,
      resourceType: 'MODAL',
      details: { modalId: 'cafe-invite-worker' },
    });
  }, [workersOpenInvite]);

  useEffect(() => {
    if (!tasksOpenCreate) return;
    logWorkerActivity({
      action: ActivityAction.MODAL_OPEN,
      category: ActivityCategory.VIEW,
      resourceType: 'MODAL',
      details: { modalId: 'cafe-create-task-template' },
    });
  }, [tasksOpenCreate]);

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
        return <OverviewTab />;
      case 'workers':
        return (
          <WorkersTab
            initialOpenInvite={workersOpenInvite}
            onInviteHandled={() => setWorkersOpenInvite(false)}
          />
        );
      case 'tasks':
        return (
          <TasksTab
            initialOpenCreate={tasksOpenCreate}
            onCreateHandled={() => setTasksOpenCreate(false)}
          />
        );
      case 'menu':
        return <MenuTab />;
      case 'cafe-info':
        return <CafeInfoTab />;
      case 'chats':
        return <ChatsTab />;
      case 'activity-logs':
        return (
          <ActivityLogsTab preselectedWorker={activityLogsWorker} selectionKey={activityLogsSeed} />
        );
      case 'layout':
        return <CafeLayoutEditorTab scope="cafe-admin" />;
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
