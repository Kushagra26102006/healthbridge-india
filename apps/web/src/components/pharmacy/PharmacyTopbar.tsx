'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Building2,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Pill,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications';
import { GlobalSearchCommand } from '@/components/search/GlobalSearchCommand';

export interface PharmacyTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

export function PharmacyTopbar({ onOpenMobileSidebar, className }: PharmacyTopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname.includes('/prescriptions')) return 'Prescription Queue';
    if (pathname.includes('/inventory')) return 'Inventory & Stock Management';
    if (pathname.includes('/orders')) return 'Orders & Fulfillment';
    if (pathname.includes('/dispensing')) return 'Dispensing Records';
    if (pathname.includes('/notifications')) return 'Pharmacy Notifications';
    if (pathname.includes('/profile')) return 'Pharmacy Profile';
    if (pathname.includes('/settings')) return 'Pharmacy Settings';
    return 'Pharmacy Dashboard';
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors',
        className
      )}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-muted-foreground">
            HealthBridge Pharmacy Network • Prescription Verification & Dispensing
          </p>
        </div>
      </div>

      {/* Center: Global Authorized Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <GlobalSearchCommand placeholder="Search medicines, batch numbers, or prescriptions..." />
      </div>

      {/* Right: Notification, Theme, and User Profile */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        {/* Global Real-Time Notification Bell */}
        <NotificationBell />

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs">
              <Pill className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {user?.name || 'Pharmacy'}
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                VERIFIED
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-border/60">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/pharmacy/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Pharmacy Profile
                </Link>
                <Link
                  href="/pharmacy/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings & Preferences
                </Link>
              </div>

              <div className="pt-1 border-t border-border/60">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default PharmacyTopbar;

