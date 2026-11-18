'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  Menu,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  CheckCircle2,
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

export interface PharmacyTopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

const ROUTE_TITLES: { prefix: string; title: string; parent?: { label: string; href: string } }[] = [
  { prefix: '/pharmacy/prescriptions', title: 'Prescription Queue' },
  { prefix: '/pharmacy/dispensing/history', title: 'Dispensing History', parent: { label: 'Dispensing', href: '/pharmacy/dispensing' } },
  { prefix: '/pharmacy/dispensing', title: 'Dispensing Console' },
  { prefix: '/pharmacy/orders', title: 'Orders & Fulfillment' },
  { prefix: '/pharmacy/inventory/medicines', title: 'Medicine Catalogue', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory/batches', title: 'Batch Management', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory/expiry', title: 'Expiry Management', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory/alerts', title: 'Stock Alerts', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory/stock-in', title: 'Stock-In Receiving', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory/stock-adjustment', title: 'Stock Adjustment', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory/transactions', title: 'Transaction Ledger', parent: { label: 'Inventory', href: '/pharmacy/inventory' } },
  { prefix: '/pharmacy/inventory', title: 'Medicine Inventory' },
  { prefix: '/pharmacy/suppliers', title: 'Suppliers' },
  { prefix: '/pharmacy/purchases', title: 'Purchase Orders' },
  { prefix: '/pharmacy/replenishment', title: 'Replenishment' },
  { prefix: '/pharmacy/notifications', title: 'Notifications' },
  { prefix: '/pharmacy/profile', title: 'Pharmacy Profile' },
  { prefix: '/pharmacy/settings', title: 'Profile & Settings' },
];

export function PharmacyTopbar({ onOpenMobileSidebar, className }: PharmacyTopbarProps) {
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
  const pageTitle = routeMeta?.title ?? 'Pharmacy Overview';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Pharmacy Portal', href: '/pharmacy/dashboard' },
    ...(routeMeta?.parent ? [routeMeta.parent] : []),
    ...(pathname !== '/pharmacy/dashboard' && pathname !== '/pharmacy'
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
      {/* Left: Mobile Trigger + Breadcrumb & Page Title */}
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
        <GlobalSearchCommand placeholder="Search medicines, batches, or prescriptions..." />
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="md:hidden">
          <GlobalSearchCommand compact placeholder="Search..." />
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden xl:flex items-center gap-1.5">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs px-2.5">
            <Link href="/pharmacy/inventory/stock-in">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Stock-In</span>
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild className="h-8 text-xs px-2.5">
            <Link href="/pharmacy/dispensing">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dispense</span>
            </Link>
          </Button>
        </div>

        <ThemeToggle />
        <NotificationBell />

        {/* Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="Pharmacy account menu"
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-md border border-border bg-surface hover:bg-muted/70 transition-colors focus-ring"
          >
            <Avatar name={user?.name || 'Pharmacy'} size="sm" />
            <div className="hidden xl:flex flex-col text-left leading-tight max-w-[116px]">
              <span className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Pharmacy'}
              </span>
              <span className="text-[11px] text-muted-foreground">Dispensary</span>
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
                  <Badge variant="teal" size="sm" className="mt-1.5 uppercase">
                    PHARMACY
                  </Badge>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/pharmacy/profile"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>Pharmacy Profile</span>
                  </Link>
                  <Link
                    href="/pharmacy/settings"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-sm hover:bg-muted text-foreground transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
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

export default PharmacyTopbar;
