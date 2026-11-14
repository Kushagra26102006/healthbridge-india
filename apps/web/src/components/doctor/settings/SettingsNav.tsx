'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserCheck,
  Building2,
  Lock,
  Laptop,
  Bell,
  Clock,
  LayoutGrid,
} from 'lucide-react';

interface SettingsTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTINGS_TABS: SettingsTab[] = [
  { label: 'Settings Hub', href: '/doctor/settings', icon: LayoutGrid },
  { label: 'Professional Profile', href: '/doctor/settings/professional', icon: UserCheck },
  { label: 'Practice & Facility', href: '/doctor/settings/practice', icon: Building2 },
  { label: 'Security & Password', href: '/doctor/settings/security', icon: Lock },
  { label: 'Active Sessions', href: '/doctor/settings/sessions', icon: Laptop },
  { label: 'Notifications', href: '/doctor/settings/notifications', icon: Bell },
  { label: 'Weekly Schedule', href: '/doctor/schedule', icon: Clock },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/80 overflow-x-auto scrollbar-none mb-6">
      <nav className="flex space-x-1 sm:space-x-2 py-1 min-w-max" aria-label="Settings Navigation Tabs">
        {SETTINGS_TABS.map((tab) => {
          const isActive =
            tab.href === '/doctor/settings'
              ? pathname === '/doctor/settings'
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default SettingsNav;
