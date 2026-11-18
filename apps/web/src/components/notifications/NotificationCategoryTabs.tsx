'use client';

import React from 'react';
import type { NotificationCategory, UserRole } from '@healthbridge/shared-types';

export type NotificationTabKey = 'ALL' | 'UNREAD' | 'READ' | NotificationCategory;

interface NotificationCategoryTabsProps {
  activeTab: NotificationTabKey;
  onTabChange: (tab: NotificationTabKey) => void;
  categoryCounts?: Partial<Record<NotificationCategory, number>>;
  totalCount?: number;
  unreadCount?: number;
  role?: UserRole;
}

const ROLE_CATEGORIES: Record<UserRole, NotificationCategory[]> = {
  PATIENT: ['APPOINTMENT', 'PRESCRIPTION', 'LAB', 'CONSENT', 'ORDER', 'SECURITY'],
  DOCTOR: ['APPOINTMENT', 'LAB', 'CONSENT', 'PRESCRIPTION', 'SECURITY'],
  PHARMACY: ['PRESCRIPTION', 'ORDER', 'INVENTORY', 'PROCUREMENT', 'SECURITY'],
  LABORATORY: ['LAB', 'SECURITY', 'SYSTEM'],
  ADMIN: ['SYSTEM', 'SECURITY'],
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  APPOINTMENT: 'Appointments',
  PRESCRIPTION: 'Prescriptions',
  LAB: 'Laboratory',
  CONSENT: 'Consent & ABDM',
  ORDER: 'Orders',
  INVENTORY: 'Inventory',
  PROCUREMENT: 'Procurement',
  SECURITY: 'Security',
  SYSTEM: 'Operations',
};

export function NotificationCategoryTabs({
  activeTab,
  onTabChange,
  categoryCounts = {},
  totalCount = 0,
  unreadCount = 0,
  role,
}: NotificationCategoryTabsProps) {
  const categories: NotificationCategory[] = role
    ? ROLE_CATEGORIES[role] || ROLE_CATEGORIES.PATIENT
    : ['APPOINTMENT', 'PRESCRIPTION', 'LAB', 'CONSENT', 'ORDER', 'INVENTORY', 'PROCUREMENT', 'SECURITY', 'SYSTEM'];

  const tabs: { key: NotificationTabKey; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All', count: totalCount },
    { key: 'UNREAD', label: 'Unread', count: unreadCount },
    { key: 'READ', label: 'Read' },
    ...categories.map((cat) => ({
      key: cat as NotificationTabKey,
      label: CATEGORY_LABELS[cat],
      count: categoryCounts[cat] || 0,
    })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter notifications by status or category"
      className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 scrollbar-none text-xs"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.key === 'UNREAD'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
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
