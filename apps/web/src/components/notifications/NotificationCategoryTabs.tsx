'use client';

import React from 'react';
import type { NotificationCategory } from '@healthbridge/shared-types';

export type NotificationTabKey = 'ALL' | 'UNREAD' | NotificationCategory;

interface NotificationCategoryTabsProps {
  activeTab: NotificationTabKey;
  onTabChange: (tab: NotificationTabKey) => void;
  categoryCounts?: Partial<Record<NotificationCategory, number>>;
  totalCount?: number;
  unreadCount?: number;
}

export function NotificationCategoryTabs({
  activeTab,
  onTabChange,
  categoryCounts = {},
  totalCount = 0,
  unreadCount = 0,
}: NotificationCategoryTabsProps) {
  const tabs: { key: NotificationTabKey; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All', count: totalCount },
    { key: 'UNREAD', label: 'Unread', count: unreadCount },
    { key: 'PRESCRIPTION', label: 'Prescriptions', count: categoryCounts.PRESCRIPTION || 0 },
    { key: 'ORDER', label: 'Orders', count: categoryCounts.ORDER || 0 },
    { key: 'INVENTORY', label: 'Inventory', count: categoryCounts.INVENTORY || 0 },
    { key: 'PROCUREMENT', label: 'Procurement', count: categoryCounts.PROCUREMENT || 0 },
    { key: 'SECURITY', label: 'Security', count: categoryCounts.SECURITY || 0 },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none text-xs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.key === 'UNREAD'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
