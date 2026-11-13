'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PatientTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

export function PatientTopbar({ onOpenMobileSidebar, className }: PatientTopbarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname.includes('/records')) return 'Health Records';
    if (pathname.includes('/appointments')) return 'Appointments';
    if (pathname.includes('/prescriptions')) return 'Prescriptions';
    if (pathname.includes('/lab-reports')) return 'Laboratory Reports';
    if (pathname.includes('/consent')) return 'Consent Management';
    if (pathname.includes('/profile')) return 'Patient Profile';
    if (pathname.includes('/settings')) return 'Account Settings';
    return 'Dashboard Overview';
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 md:h-20 w-full bg-background/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors',
        className
      )}
    >
      {/* Left: Mobile Drawer Trigger + Breadcrumb Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation drawer"
            className="lg:hidden p-2 rounded-xl border border-input bg-card text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-semibold text-muted-foreground">
              Patient Portal /
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {getPageTitle()}
            </h1>
          </div>
          <span className="text-[11px] text-muted-foreground hidden md:inline-block">
            One Nation One Health Record • ABDM Connected
          </span>
        </div>
      </div>

      {/* Middle: Quick Search Input Placeholder */}
      <div className="hidden md:flex items-center flex-1 max-w-xs xl:max-w-md mx-4">
        <div className="relative w-full">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            readOnly
            placeholder="Search health records, doctors, prescriptions..."
            className="w-full pl-9 pr-12 py-1.5 text-xs rounded-xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => {
              // Smooth focus interaction placeholder
            }}
          />
          <kbd className="absolute right-2.5 top-2 text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border bg-background">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ABHA Badge Indicator */}
        <Badge
          variant="abha"
          className="hidden sm:flex items-center gap-1.5 text-[11px] py-1 px-2.5 shadow-xs"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>ABHA Ready</span>
        </Badge>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="View notifications"
            className="relative p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-background" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notifications
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-accent/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Security Session Active</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Your authenticated patient session is secured under ABDM encryption protocols.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 space-y-1">
                  <span className="font-semibold text-foreground">ABHA Digital Health Record</span>
                  <p className="text-[11px] text-muted-foreground">
                    Link your 14-digit ABHA ID to sync historical lab reports and prescriptions
                    nationwide.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Profile Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="Open user profile menu"
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="text-left hidden xl:block leading-tight max-w-[120px]">
              <p className="text-xs font-bold text-foreground truncate">
                {user?.name || 'Patient'}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {user?.accountStatus?.toLowerCase() || 'active'}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150">
              {/* Profile Summary */}
              <div className="p-2.5 mb-1 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 uppercase">
                  {user?.role || 'PATIENT'} • {user?.accountStatus || 'ACTIVE'}
                </Badge>
              </div>

              {/* Navigation Items */}
              <div className="py-1 space-y-0.5 text-xs">
                <Link
                  href="/patient/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-accent text-foreground transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/patient/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-accent text-foreground transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Settings & Privacy</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="pt-1 mt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PatientTopbar;
