'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Building2,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Pill,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePharmacyInventoryAlerts } from '@/features/pharmacy/hooks/use-pharmacy';

export interface PharmacyTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

export function PharmacyTopbar({ onOpenMobileSidebar, className }: PharmacyTopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const { data: alerts } = usePharmacyInventoryAlerts();

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
    if (pathname.includes('/prescriptions')) return 'Prescription Queue';
    if (pathname.includes('/inventory')) return 'Inventory & Stock Management';
    if (pathname.includes('/orders')) return 'Orders & Fulfillment';
    if (pathname.includes('/dispensing')) return 'Dispensing Records';
    if (pathname.includes('/notifications')) return 'Pharmacy Notifications';
    if (pathname.includes('/profile')) return 'Pharmacy Profile';
    if (pathname.includes('/settings')) return 'Pharmacy Settings';
    return 'Pharmacy Dashboard';
  };

  const alertCount = alerts?.length || 0;

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

      {/* Center: Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search medicines, batch numbers, or prescriptions..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-muted/50 border border-border/80 focus:bg-background focus:border-teal-500 focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right: Notification, Theme, and User Profile */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-xl py-3 z-50 animate-in fade-in-50 slide-in-from-top-2">
              <div className="px-4 pb-2 border-b border-border/60 flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-500" /> Inventory Alerts
                </span>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {alertCount} Alerts
                </Badge>
              </div>

              <div className="max-h-72 overflow-y-auto px-2 py-2 space-y-1">
                {alertCount === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No urgent stock or expiry alerts
                  </div>
                ) : (
                  alerts?.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors flex items-start gap-3 text-xs"
                    >
                      <AlertTriangle
                        className={cn(
                          'w-4 h-4 mt-0.5 shrink-0',
                          alert.alertStatus === 'EXPIRED' ? 'text-red-500' : 'text-amber-500'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {alert.medicineName}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          Batch: {alert.batchNumber} • Qty: {alert.availableQuantity}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] shrink-0 font-medium',
                          alert.alertStatus === 'EXPIRED'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500'
                        )}
                      >
                        {alert.alertStatus}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 pt-2 border-t border-border/60">
                <Link
                  href="/pharmacy/inventory"
                  onClick={() => setNotificationsOpen(false)}
                  className="block text-center text-xs font-semibold text-teal-600 hover:text-teal-500 py-1"
                >
                  View Complete Inventory →
                </Link>
              </div>
            </div>
          )}
        </div>

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

