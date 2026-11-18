'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Pill,
  FlaskConical,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  HeartPulse,
  Stethoscope,
  ShoppingBag,
  Bell,
  Fingerprint,
  Building2,
  History,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { modalBackdrop } from '@/lib/motion/variants';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  section?: 'primary' | 'secondary';
}

export const PATIENT_NAV_ITEMS: NavItem[] = [
  // Core 10 Patient Navigation Items
  { label: 'Overview', href: '/patient/dashboard', icon: LayoutDashboard, section: 'primary' },
  { label: 'My ABHA Card', href: '/patient/abha', icon: Fingerprint, section: 'primary' },
  { label: 'Health Records', href: '/patient/records', icon: FileText, section: 'primary' },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar, section: 'primary' },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill, section: 'primary' },
  { label: 'Lab Reports', href: '/patient/lab-reports', icon: FlaskConical, section: 'primary' },
  { label: 'Consent Management', href: '/patient/consent', icon: ShieldCheck, section: 'primary' },
  {
    label: 'Connected Hospitals',
    href: '/patient/abdm/linked-records',
    icon: Building2,
    section: 'primary',
  },
  { label: 'Access History', href: '/patient/data-sharing', icon: History, section: 'primary' },
  { label: 'Profile & Settings', href: '/patient/settings', icon: Settings, section: 'primary' },
  // Preserved Quick Shortcuts
  { label: 'Activity Analytics', href: '/patient/analytics', icon: BarChart3, section: 'secondary' },
  { label: 'Find Doctors', href: '/patient/doctors', icon: Stethoscope, section: 'secondary' },
  { label: 'Pharmacy Orders', href: '/patient/orders', icon: ShoppingBag, section: 'secondary' },
  { label: 'Notifications', href: '/patient/notifications', icon: Bell, section: 'secondary' },
  { label: 'My Profile', href: '/patient/profile', icon: User, section: 'secondary' },
];

export interface PatientSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function PatientSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  className,
}: PatientSidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/patient/dashboard') {
      return pathname === '/patient/dashboard';
    }
    if (href === '/patient/lab-reports' && pathname.startsWith('/patient/lab-orders')) {
      return true;
    }
    if (href === '/patient/abdm/linked-records' && pathname.startsWith('/patient/abdm')) {
      return true;
    }
    if (href === '/patient/data-sharing' && pathname.startsWith('/patient/privacy')) {
      return true;
    }
    return pathname.startsWith(href);
  };

  const primaryItems = PATIENT_NAV_ITEMS.filter((i) => i.section !== 'secondary');
  const secondaryItems = PATIENT_NAV_ITEMS.filter((i) => i.section === 'secondary');

  const renderNavLink = (item: NavItem) => {
    const active = isLinkActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => {
          if (onCloseMobile) onCloseMobile();
        }}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 relative focus-ring',
          active
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/75',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-pill bg-primary"
          />
        )}
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <Badge variant="info" size="sm" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border select-none">
      {/* Brand Header */}
      <div className="h-16 md:h-[72px] flex items-center justify-between px-4 border-b border-border/80 shrink-0">
        <Link
          href="/patient/dashboard"
          className="flex items-center gap-2.5 group focus-ring rounded-md p-1 min-w-0"
          aria-label="HealthBridge Patient Portal"
        >
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-brand-blue via-brand-teal to-brand-cyan text-white flex items-center justify-center shrink-0 shadow-xs group-hover:shadow-glow transition-shadow">
            <HeartPulse className="h-5 w-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-bold text-base tracking-tight text-foreground truncate">
                Health<span className="text-secondary">Bridge</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Patient Portal
              </span>
            </div>
          )}
        </Link>

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-ring"
            aria-label="Close navigation drawer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {onToggleCollapse && !mobileOpen && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex items-center justify-center h-7 w-7 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-ring shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
        aria-label="Patient Dashboard Navigation"
      >
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Care Workspace
            </p>
          )}
          {primaryItems.map(renderNavLink)}
        </div>

        <div className="space-y-1 pt-3 border-t border-border/70">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Care Services
            </p>
          )}
          {secondaryItems.map(renderNavLink)}
        </div>
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-border/80 space-y-2 bg-muted/25 shrink-0">
        {!collapsed ? (
          <Link
            href="/patient/profile"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-2.5 p-2 rounded-md bg-surface border border-border/70 hover:border-primary/30 transition-colors focus-ring"
          >
            <Avatar name={user?.name || 'Patient'} size="sm" status="online" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Patient'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Link>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar name={user?.name || 'Patient'} size="sm" status="online" />
          </div>
        )}

        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoading}
          aria-label="Sign out from patient account"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-error hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-ring disabled:opacity-50',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-200 ease-out z-30',
          collapsed ? 'w-[76px]' : 'w-64 xl:w-72',
          className
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Animated Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Patient Navigation Drawer"
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

export default PatientSidebar;
