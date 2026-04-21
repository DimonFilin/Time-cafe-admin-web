'use client';

import { useState, useEffect } from 'react';
import { WorkersTab } from '../workers/ui/WorkersTab';
import { TasksTab } from '../tasks/ui/TasksTab';
import { ActivityLogsTab } from '../activity-logs/ui/ActivityLogsTab';
import { OverviewTab } from '../overview/ui/OverviewTab';
import { CafeInfoTab } from '../cafe/ui/CafeInfoTab';
import { MenuTab } from '../menu/ui/MenuTab';
import { ChatsTab } from '@/features/chats/ui/ChatsTab';
import { chatsApi } from '@/features/chats/api/chats-api';

type TabId = 'overview' | 'workers' | 'tasks' | 'menu' | 'chats' | 'cafe-info' | 'activity-logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'workers', label: 'Workers' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'menu', label: 'Menu' },
  { id: 'chats', label: 'Chats' },
  { id: 'cafe-info', label: 'Cafe Info' },
  { id: 'activity-logs', label: 'Activity Logs' },
];

export function CafeAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [workersOpenInvite, setWorkersOpenInvite] = useState(false);
  const [tasksOpenCreate, setTasksOpenCreate] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    const handleSwitchToActivityLogs = () => {
      setActiveTab('activity-logs');
    };

    const handleSwitchTab = (
      e: CustomEvent<{ tab: string; openInvite?: boolean; openCreate?: boolean }>,
    ) => {
      const { tab, openInvite, openCreate } = e.detail;
      setActiveTab(tab as TabId);
      if (openInvite) setWorkersOpenInvite(true);
      if (openCreate) setTasksOpenCreate(true);
    };

    window.addEventListener('switchToActivityLogs', handleSwitchToActivityLogs as EventListener);
    window.addEventListener('cafeAdminSwitchTab', handleSwitchTab as EventListener);

    return () => {
      window.removeEventListener(
        'switchToActivityLogs',
        handleSwitchToActivityLogs as EventListener,
      );
      window.removeEventListener('cafeAdminSwitchTab', handleSwitchTab as EventListener);
    };
  }, []);

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
