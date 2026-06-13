'use client';

import { cn } from '@/shared/lib/cn';

export type CafeCardTab = 'main' | 'additional';

export function CafeCardTabs({
  active,
  onChange,
}: {
  active: CafeCardTab;
  onChange: (tab: CafeCardTab) => void;
}) {
  const tabs: { id: CafeCardTab; label: string }[] = [
    { id: 'main', label: 'Основная' },
    { id: 'additional', label: 'Дополнительно' },
  ];

  return (
    <div className="flex gap-1 rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-[rgb(var(--tc-surface))] text-[rgb(var(--tc-fg))] shadow-sm'
              : 'text-[rgb(var(--tc-muted))] hover:text-[rgb(var(--tc-fg))]',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
