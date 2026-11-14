'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  KeyRound,
  Laptop,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { label: 'Overview', href: '/patient/settings', icon: Settings },
  { label: 'Security & Password', href: '/patient/settings/security', icon: KeyRound },
  { label: 'Active Sessions', href: '/patient/settings/sessions', icon: Laptop },
  { label: 'Notifications', href: '/patient/settings/notifications', icon: Bell },
  { label: 'Privacy & Data', href: '/patient/settings/privacy', icon: ShieldCheck },
];

export const SettingsNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/60">
      {SETTINGS_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/patient/settings'
            ? pathname === '/patient/settings'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors',
              isActive
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

