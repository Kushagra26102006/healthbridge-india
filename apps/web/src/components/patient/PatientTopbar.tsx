'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  Menu,
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { NotificationBell } from '@/components/notifications';
import { GlobalSearchCommand } from '@/components/search/GlobalSearchCommand';
import { dropdownEntrance } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

export interface PatientTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

const ROUTE_TITLES: { prefix: string; title: string; parent?: { label: string; href: string } }[] = [
  { prefix: '/patient/abha', title: 'My ABHA Card' },
  { prefix: '/patient/abdm', title: 'Connected Hospitals & ABDM' },
  { prefix: '/patient/records', title: 'Health Records' },
  { prefix: '/patient/health-timeline', title: 'Health Timeline' },
  { prefix: '/patient/appointments/book', title: 'Book Appointment', parent: { label: 'Appointments', href: '/patient/appointments' } },
  { prefix: '/patient/appointments/history', title: 'Appointment History', parent: { label: 'Appointments', href: '/patient/appointments' } },
  { prefix: '/patient/appointments', title: 'Appointments' },
  { prefix: '/patient/doctors', title: 'Find Doctors' },
  { prefix: '/patient/prescriptions', title: 'Prescriptions' },
  { prefix: '/patient/orders', title: 'Pharmacy Orders' },
  { prefix: '/patient/lab-orders', title: 'Lab Orders' },
  { prefix: '/patient/lab-reports', title: 'Lab Reports' },
  { prefix: '/patient/reports', title: 'Diagnostic Reports' },
  { prefix: '/patient/consent/requests', title: 'Consent Requests', parent: { label: 'Consent', href: '/patient/consent' } },
  { prefix: '/patient/consent/history', title: 'Consent History', parent: { label: 'Consent', href: '/patient/consent' } },
  { prefix: '/patient/consent/artefacts', title: 'ABDM Artefacts', parent: { label: 'Consent', href: '/patient/consent' } },
  { prefix: '/patient/consent', title: 'Consent Management' },
  { prefix: '/patient/data-sharing', title: 'Access History' },
  { prefix: '/patient/privacy', title: 'Privacy & Rights' },
  { prefix: '/patient/notifications', title: 'Notifications' },
  { prefix: '/patient/profile', title: 'My Profile' },
  { prefix: '/patient/settings', title: 'Profile & Settings' },
];

export function PatientTopbar({ onOpenMobileSidebar, className }: PatientTopbarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const routeMeta = ROUTE_TITLES.find((entry) => pathname.startsWith(entry.prefix));
  const pageTitle = routeMeta?.title ?? 'Dashboard Overview';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Patient Portal', href: '/patient/dashboard' },
    ...(routeMeta?.parent ? [routeMeta.parent] : []),
    ...(pathname !== '/patient/dashboard' ? [{ label: pageTitle }] : [{ label: 'Overview' }]),
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 md:h-[72px] w-full glass-nav px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-colors',
        className
      )}
    >
      {/* Left: Mobile Drawer Trigger + Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation drawer"
            className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-muted focus-ring"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <Breadcrumb items={breadcrumbItems} className="hidden sm:block" />
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Middle: Global Authorized Search (Desktop/Tablet) */}
      <div className="hidden md:flex items-center flex-1 max-w-xs xl:max-w-md mx-2">
        <GlobalSearchCommand placeholder="Search records, doctors, prescriptions..." />
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Compact Search Trigger for Mobile Screens (< 768px) */}
        <div className="md:hidden">
          <GlobalSearchCommand compact placeholder="Search..." />
        </div>

        <Link href="/patient/abha" className="hidden xl:inline-flex focus-ring rounded-pill">
          <Badge variant="abha" size="sm" className="py-1 px-2.5 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ABHA</span>
          </Badge>
        </Link>

        <ThemeToggle />
        <NotificationBell />

        {/* Patient Profile Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="Open user profile menu"
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-md border border-border bg-surface hover:bg-muted/70 transition-colors focus-ring"
          >
            <Avatar name={user?.name || 'Patient'} size="sm" />
            <div className="text-left hidden xl:block leading-tight max-w-[116px]">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Patient'}
              </p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {user?.accountStatus?.toLowerCase() || 'active'}
              </p>
            </div>
            <ChevronDown
              className="h-3.5 w-3.5 text-muted-foreground hidden sm:block"
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <m.div
                role="menu"
                variants={dropdownEntrance}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-dropdown absolute right-0 mt-2 w-60 rounded-lg p-2 text-popover-foreground z-50 origin-top-right"
              >
                <div className="p-2.5 mb-1.5 rounded-md bg-muted/50 border border-border/70">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <Badge variant="outline" size="sm" className="mt-1.5 uppercase">
                    {user?.role || 'PATIENT'}
                  </Badge>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/patient/profile"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/patient/abha"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>My ABHA Card</span>
                  </Link>
                  <Link
                    href="/patient/settings"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>Settings &amp; Preferences</span>
                  </Link>
                </div>

                <div className="pt-1.5 mt-1.5 border-t border-border">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-sm text-xs font-semibold text-error hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default PatientTopbar;
