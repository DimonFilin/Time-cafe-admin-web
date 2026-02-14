'use client';

import { useState, useEffect } from 'react';
import { WorkersTab } from '../workers/ui/WorkersTab';
import { TasksTab } from '../tasks/ui/TasksTab';
import { ActivityLogsTab } from '../activity-logs/ui/ActivityLogsTab';
import { OverviewTab } from '../overview/ui/OverviewTab';
import { CafeInfoTab } from '../cafe/ui/CafeInfoTab';

type TabId = 'overview' | 'workers' | 'tasks' | 'cafe-info' | 'activity-logs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'workers', label: 'Workers' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'cafe-info', label: 'Cafe Info' },
  { id: 'activity-logs', label: 'Activity Logs' },
];

export function CafeAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
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
        return <OverviewTab />;
      case 'workers':
        return <WorkersTab />;
      case 'tasks':
        return <TasksTab />;
      case 'cafe-info':
        return <CafeInfoTab />;
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
