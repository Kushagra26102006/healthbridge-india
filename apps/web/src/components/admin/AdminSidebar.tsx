'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  KeyRound,
  FileCheck2,
  ShieldCheck,
  Globe,
  ShieldAlert,
  AlertTriangle,
  Flame,
  ScrollText,
  Bug,
  DatabaseBackup,
  Server,
  Activity,
  Video,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { modalBackdrop } from '@/lib/motion/variants';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

/**
 * Only modules backed by verified HealthBridge India backend endpoints and
 * server-side ADMIN authorization are exposed in the Super Admin navigation.
 */
export const ADMIN_NAV_SECTIONS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: 'Platform Governance',
    items: [
      { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Platform Analytics', href: '/admin/platform-overview', icon: BarChart3 },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: KeyRound },
    ],
  },
  {
    title: 'Privacy & Consent',
    items: [
      { label: 'Consent Oversight', href: '/admin/consent-oversight', icon: FileCheck2 },
      { label: 'Privacy Requests', href: '/admin/privacy-requests', icon: ShieldCheck },
      { label: 'ABDM Governance', href: '/admin/integrations/abdm', icon: Globe },
    ],
  },
  {
    title: 'Security & Audit',
    items: [
      { label: 'Security Center', href: '/admin/security/overview', icon: ShieldAlert },
      { label: 'Security Alerts', href: '/admin/security/alerts', icon: AlertTriangle },
      { label: 'Security Incidents', href: '/admin/security/incidents', icon: Flame },
      { label: 'Audit & Security Logs', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Vulnerabilities', href: '/admin/security/vulnerabilities', icon: Bug },
      { label: 'Data Protection & DR', href: '/admin/security/data-protection', icon: DatabaseBackup },
    ],
  },
  {
    title: 'System & Operations',
    items: [
      { label: 'System Monitoring', href: '/admin/system-monitoring', icon: Server },
      { label: 'Video Consultations', href: '/admin/telemedicine', icon: Video },
      { label: 'Event Outbox Monitor', href: '/admin/platform/events', icon: Activity },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const isLinkActive = (item: AdminNavItem) => {
    if (item.exact) {
      return pathname === item.href || pathname === '/admin';
    }
    return pathname.startsWith(item.href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border select-none">
      {/* Brand Header */}
      <div className="h-16 md:h-[72px] flex items-center justify-between px-4 border-b border-border/80 shrink-0">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 group focus-ring rounded-md p-1 min-w-0"
          aria-label="HealthBridge Super Admin Control Center"
        >
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-brand-navy via-brand-blue to-brand-teal text-white flex items-center justify-center shrink-0 shadow-xs group-hover:shadow-glow transition-shadow">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-bold text-base tracking-tight text-foreground truncate">
                Health<span className="text-secondary">Bridge</span>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                Admin Control Center
              </span>
            </div>
          )}
        </Link>

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-ring"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {onToggleCollapse && !mobileOpen && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex items-center justify-center h-7 w-7 rounded-sm border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-ring shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
        aria-label="Administrator Navigation"
      >
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile?.()}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 relative focus-ring',
                    active
                      ? 'bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/75',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-pill bg-primary dark:bg-secondary"
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
                      active
                        ? 'text-primary dark:text-secondary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Admin Profile & Sign Out */}
      <div className="p-3 border-t border-border/80 bg-muted/25 space-y-2 shrink-0">
        {!collapsed ? (
          <Link
            href="/admin/settings"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-2.5 p-2 rounded-md bg-surface border border-border/70 hover:border-primary/30 transition-colors focus-ring"
          >
            <Avatar name={user?.name || 'Platform Admin'} size="sm" status="online" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Platform Admin'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Link>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar name={user?.name || 'Platform Admin'} size="sm" status="online" />
          </div>
        )}

        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoading}
          aria-label="Sign out of administrator portal"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-error hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-ring disabled:opacity-50',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 transition-[width] duration-200 ease-out sticky top-0 h-screen z-30',
          collapsed ? 'w-[76px]' : 'w-64 xl:w-72',
          className
        )}
      >
        {navContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Administrator Navigation Drawer"
            className="lg:hidden fixed inset-0 z-50 flex"
          >
            <m.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <m.div
              initial={{ x: '-100%' }}
              animate={{
                x: 0,
                transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
              }}
              exit={{
                x: '-100%',
                transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
              }}
              className="relative w-72 max-w-[85vw] h-full shadow-dialog z-10"
            >
              {navContent}
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminSidebar;
