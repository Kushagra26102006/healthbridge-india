'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Stethoscope,
  Pill,
  UserCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  ListOrdered,
  Database,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DoctorNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const DOCTOR_NAV_ITEMS: DoctorNavItem[] = [
  { label: 'Clinical Overview', href: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { label: 'Patient Queue', href: '/doctor/queue', icon: ListOrdered },
  { label: 'My Patients', href: '/doctor/patients', icon: Users },
  { label: 'Schedule & Availability', href: '/doctor/schedule', icon: Clock },
  { label: 'Clinical Encounters', href: '/doctor/encounters', icon: Stethoscope },
  { label: 'Prescriptions', href: '/doctor/prescriptions', icon: Pill },
  { label: 'Medication Catalog', href: '/doctor/medications', icon: Database },
  { label: 'Professional Profile', href: '/doctor/profile', icon: UserCheck },
  { label: 'Practice Settings', href: '/doctor/settings', icon: Settings },
];

export interface DoctorSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function DoctorSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  className,
}: DoctorSidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/doctor/dashboard') {
      return pathname === '/doctor/dashboard';
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border select-none">
      {/* Brand Header */}
      <div className="h-16 md:h-20 flex items-center justify-between px-4 sm:px-5 border-b border-border/80">
        <Link
          href="/doctor/dashboard"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1"
          aria-label="HealthBridge Doctor Portal"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 via-blue-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/10 group-hover:shadow-glow transition-all">
            <Stethoscope className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden transition-all duration-200">
              <span className="font-extrabold text-base tracking-tight text-foreground truncate">
                Health<span className="text-blue-600 dark:text-blue-400">Bridge</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                Doctor Portal
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400">
                  CLINICAL
                </Badge>
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close navigation sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {DOCTOR_NAV_ITEMS.map((item) => {
          const active = isLinkActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (mobileOpen && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative',
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && (
                <span className="truncate flex-1 font-medium">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  {item.badge}
                </span>
              )}

              {/* Active Indicator Strip when collapsed */}
              {collapsed && active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop Collapse Toggle */}
      {onToggleCollapse && (
        <div className="hidden lg:flex px-3 py-2 border-t border-border/80 justify-end">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* Footer Doctor Identity & Logout Section */}
      <div className="p-3 border-t border-border/80 bg-muted/30">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl transition-all',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60">
              Dr
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-semibold text-foreground truncate">
                  Dr. {user?.name || 'Physician'}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user?.email || 'doctor@healthbridge.in'}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoading}
              title="Sign Out"
              aria-label="Sign out of doctor portal"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30',
          collapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Slide-in */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </div>
    </>
  );
}
