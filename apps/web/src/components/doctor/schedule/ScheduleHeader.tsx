'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Clock,
  CalendarDays,
  ShieldBan,
  Sliders,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduleHeaderProps {
  onOpenLeaveModal?: () => void;
  onOpenOverrideModal?: () => void;
}

export function ScheduleHeader({ onOpenLeaveModal, onOpenOverrideModal }: ScheduleHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/doctor/schedule',
      icon: Clock,
      exact: true,
    },
    {
      label: 'Weekly Hours',
      href: '/doctor/schedule/weekly',
      icon: CalendarDays,
      exact: false,
    },
    {
      label: 'Calendar & Slots',
      href: '/doctor/schedule/availability',
      icon: Calendar,
      exact: false,
    },
    {
      label: 'Blocked Dates & Leave',
      href: '/doctor/schedule/blocked-dates',
      icon: ShieldBan,
      exact: false,
    },
    {
      label: 'Consultation Settings',
      href: '/doctor/schedule/settings',
      icon: Sliders,
      exact: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            My Schedule
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your consultation hours and appointment availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenLeaveModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenLeaveModal}
              className="text-xs h-8 gap-1.5 border-border hover:bg-muted"
            >
              <ShieldBan className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Block Leave
            </Button>
          )}

          {onOpenOverrideModal && (
            <Button
              size="sm"
              onClick={onOpenOverrideModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Special Day Override
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 border-b border-border/80 overflow-x-auto pb-px scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default ScheduleHeader;
