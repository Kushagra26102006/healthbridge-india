'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SlidersHorizontal,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Laptop,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const PHARMACY_SETTINGS_TABS = [
  { label: 'Overview', href: '/pharmacy/settings', icon: SlidersHorizontal, exact: true },
  { label: 'General', href: '/pharmacy/settings/general', icon: Building2 },
  { label: 'Business & License', href: '/pharmacy/settings/business', icon: FileText },
  { label: 'Operating Hours', href: '/pharmacy/settings/operating-hours', icon: Clock },
  { label: 'Services', href: '/pharmacy/settings/services', icon: Sparkles },
  { label: 'Staff Management', href: '/pharmacy/settings/staff', icon: Users },
  { label: 'Security', href: '/pharmacy/settings/security', icon: ShieldCheck },
  { label: 'Sessions', href: '/pharmacy/settings/sessions', icon: Laptop },
  { label: 'Notifications', href: '/pharmacy/settings/notifications', icon: Bell },
];

export function PharmacySettingsNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
      <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-2" aria-label="Settings Navigation">
        {PHARMACY_SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-sky-50 text-sky-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-sky-600' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default PharmacySettingsNav;

