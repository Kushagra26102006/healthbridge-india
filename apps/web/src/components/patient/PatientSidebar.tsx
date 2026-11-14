'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const PATIENT_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Health Records', href: '/patient/records', icon: FileText },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Find Doctors', href: '/patient/doctors', icon: Stethoscope },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: Pill },
  { label: 'Pharmacy Orders', href: '/patient/orders', icon: ShoppingBag },
  { label: 'Lab Reports', href: '/patient/lab-reports', icon: FlaskConical },
  { label: 'Consent Management', href: '/patient/consent', icon: ShieldCheck },
  { label: 'Notifications', href: '/patient/notifications', icon: Bell },
  { label: 'My Profile', href: '/patient/profile', icon: User },
  { label: 'Settings', href: '/patient/settings', icon: Settings },
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
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border select-none">
      {/* Brand Header */}
      <div className="h-16 md:h-20 flex items-center justify-between px-4 sm:px-5 border-b border-border/80">
        <Link
          href="/patient/dashboard"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1"
          aria-label="HealthBridge Patient Portal"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-teal-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-500/10 group-hover:shadow-glow transition-all">
            <HeartPulse className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden transition-all duration-200">
              <span className="font-extrabold text-base tracking-tight text-foreground truncate">
                Health<span className="text-teal-600 dark:text-teal-400">Bridge</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Patient Portal
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Close navigation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto"
        aria-label="Patient Dashboard Navigation"
      >
        <div className="px-2 mb-2">
          {!collapsed ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Main Menu
            </span>
          ) : (
            <div className="h-2" />
          )}
        </div>

        {PATIENT_NAV_ITEMS.map((item) => {
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
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/70',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-600 dark:bg-teal-400" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  active
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <Badge variant="secondary" className="ml-auto text-[10px] py-0 px-1.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-border/80 space-y-2 bg-muted/30">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border/60">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {user?.name || 'Patient'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
              Patient
            </Badge>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div
              className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm"
              title={user?.name || 'Patient'}
            >
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoading}
          aria-label="Sign out from patient account"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200 z-30',
          collapsed ? 'w-20' : 'w-64 xl:w-72',
          className
        )}
      >
        {navContent}
      </aside>

      {/* 2. Mobile Drawer & Backdrop */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

export default PatientSidebar;
