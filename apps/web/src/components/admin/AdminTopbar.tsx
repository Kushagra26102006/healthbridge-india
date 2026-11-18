'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  Menu,
  Settings,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Server,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { NotificationBell } from '@/components/notifications';
import { GlobalSearchCommand } from '@/components/search/GlobalSearchCommand';
import { dropdownEntrance } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

export interface AdminTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

const ROUTE_TITLES: { prefix: string; title: string; parent?: { label: string; href: string } }[] = [
  { prefix: '/admin/platform-overview', title: 'Platform Analytics' },
  { prefix: '/admin/platform/events', title: 'Event Outbox Monitor', parent: { label: 'System Monitoring', href: '/admin/system-monitoring' } },
  { prefix: '/admin/roles', title: 'Roles & Permissions' },
  { prefix: '/admin/consent-oversight', title: 'Consent Oversight' },
  { prefix: '/admin/privacy-requests', title: 'Privacy Requests' },
  { prefix: '/admin/integrations/abdm', title: 'ABDM Governance' },
  { prefix: '/admin/security/alerts', title: 'Security Alerts', parent: { label: 'Security Center', href: '/admin/security/overview' } },
  { prefix: '/admin/security/incidents', title: 'Security Incidents', parent: { label: 'Security Center', href: '/admin/security/overview' } },
  { prefix: '/admin/security/vulnerabilities', title: 'Vulnerabilities', parent: { label: 'Security Center', href: '/admin/security/overview' } },
  { prefix: '/admin/security/data-protection', title: 'Data Protection & DR', parent: { label: 'Security Center', href: '/admin/security/overview' } },
  { prefix: '/admin/security/overview', title: 'Security Center' },
  { prefix: '/admin/audit-logs', title: 'Audit & Security Logs' },
  { prefix: '/admin/system-monitoring', title: 'System Monitoring' },
  { prefix: '/admin/notifications/preferences', title: 'Notification Preferences', parent: { label: 'Notifications', href: '/admin/notifications' } },
  { prefix: '/admin/notifications', title: 'Notifications' },
  { prefix: '/admin/settings', title: 'System Settings' },
];

export function AdminTopbar({ onOpenMobileSidebar, className }: AdminTopbarProps) {
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
  const pageTitle = routeMeta?.title ?? 'Control Center Overview';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Admin Portal', href: '/admin/dashboard' },
    ...(routeMeta?.parent ? [routeMeta.parent] : []),
    ...(pathname !== '/admin/dashboard' && pathname !== '/admin'
      ? [{ label: pageTitle }]
      : [{ label: 'Overview' }]),
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 md:h-[72px] w-full glass-nav px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-colors',
        className
      )}
    >
      {/* Left: Mobile Drawer Trigger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-muted focus-ring"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <Breadcrumb items={breadcrumbItems} className="hidden sm:block" />
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center: Global Authorized Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xs xl:max-w-md mx-2">
        <GlobalSearchCommand placeholder="Search authorized platform entities..." />
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="md:hidden">
          <GlobalSearchCommand compact placeholder="Search..." />
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden xl:flex items-center gap-1.5">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs px-2.5">
            <Link href="/admin/security/overview">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              <span>SecOps</span>
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="h-8 text-xs px-2.5">
            <Link href="/admin/system-monitoring">
              <Server className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Health</span>
            </Link>
          </Button>
        </div>

        <ThemeToggle />
        <NotificationBell />

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="Administrator account menu"
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-md border border-border bg-surface hover:bg-muted/70 transition-colors focus-ring"
          >
            <Avatar name={user?.name || 'Platform Admin'} size="sm" />
            <div className="hidden xl:flex flex-col text-left leading-tight max-w-[120px]">
              <span className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Platform Admin'}
              </span>
              <span className="text-[11px] text-muted-foreground">Governance</span>
            </div>
            <ChevronDown
              className="w-3.5 h-3.5 text-muted-foreground hidden sm:block"
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
                  <Badge variant="primary" size="sm" className="mt-1.5 uppercase">
                    ADMIN
                  </Badge>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/admin/settings"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>System Settings</span>
                  </Link>
                  <Link
                    href="/admin/notifications/preferences"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>Notification Preferences</span>
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
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
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

export default AdminTopbar;
