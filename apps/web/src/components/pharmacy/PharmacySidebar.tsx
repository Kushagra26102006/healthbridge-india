'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  LayoutDashboard,
  Pill,
  Package,
  BookOpen,
  Boxes,
  ArrowDownToLine,
  SlidersHorizontal,
  History,
  Clock,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Bell,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
  FileSpreadsheet,
  RefreshCw,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { modalBackdrop } from '@/lib/motion/variants';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export interface PharmacyNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const PHARMACY_NAV_SECTIONS: { title: string; items: PharmacyNavItem[] }[] = [
  {
    title: 'Dispensing & Operations',
    items: [
      { label: 'Overview', href: '/pharmacy/dashboard', icon: LayoutDashboard },
      { label: 'Prescription Queue', href: '/pharmacy/prescriptions', icon: Pill },
      { label: 'Dispensing', href: '/pharmacy/dispensing', icon: CheckCircle2 },
      { label: 'Orders', href: '/pharmacy/orders', icon: ShoppingCart },
      { label: 'Analytics', href: '/pharmacy/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Inventory & Expiry',
    items: [
      { label: 'Medicine Inventory', href: '/pharmacy/inventory', icon: Package },
      { label: 'Medicine Catalogue', href: '/pharmacy/inventory/medicines', icon: BookOpen },
      { label: 'Stock Alerts', href: '/pharmacy/inventory/alerts', icon: AlertTriangle },
      { label: 'Expiry Management', href: '/pharmacy/inventory/expiry', icon: Clock },
      { label: 'Batches & Stock-In', href: '/pharmacy/inventory/batches', icon: Boxes },
      { label: 'Stock Adjustments', href: '/pharmacy/inventory/stock-adjustment', icon: SlidersHorizontal },
      { label: 'Transaction Ledger', href: '/pharmacy/inventory/transactions', icon: History },
    ],
  },
  {
    title: 'Suppliers & Procurement',
    items: [
      { label: 'Suppliers', href: '/pharmacy/suppliers', icon: Truck },
      { label: 'Purchase Orders', href: '/pharmacy/purchases', icon: FileSpreadsheet },
      { label: 'Goods Receipts', href: '/pharmacy/purchases/history', icon: ArrowDownToLine },
      { label: 'Replenishment', href: '/pharmacy/replenishment', icon: RefreshCw },
    ],
  },
  {
    title: 'Organization & Settings',
    items: [
      { label: 'Notifications', href: '/pharmacy/notifications', icon: Bell },
      { label: 'Pharmacy Profile', href: '/pharmacy/profile', icon: Building2 },
      { label: 'Staff Management', href: '/pharmacy/settings/staff', icon: Users },
      { label: 'Profile & Settings', href: '/pharmacy/settings', icon: Settings },
    ],
  },
];

export interface PharmacySidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function PharmacySidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  className,
}: PharmacySidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const isLinkActive = (href: string) => {
    if (href.includes('#')) return false;
    if (href === '/pharmacy/dashboard') {
      return pathname === '/pharmacy/dashboard' || pathname === '/pharmacy';
    }
    if (href === '/pharmacy/inventory') {
      return pathname === '/pharmacy/inventory';
    }
    if (href === '/pharmacy/settings') {
      return pathname === '/pharmacy/settings';
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border select-none">
      {/* Brand Header */}
      <div className="h-16 md:h-[72px] flex items-center justify-between px-4 border-b border-border/80 shrink-0">
        <Link
          href="/pharmacy/dashboard"
          className="flex items-center gap-2.5 group focus-ring rounded-md p-1 min-w-0"
          aria-label="HealthBridge Pharmacy Workspace"
        >
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-brand-teal via-emerald-600 to-brand-cyan text-white flex items-center justify-center shrink-0 shadow-xs group-hover:shadow-glow transition-shadow">
            <Pill className="w-5 h-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-bold text-base tracking-tight text-foreground truncate">
                Health<span className="text-secondary">Bridge</span>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                Pharmacy Workspace
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
        aria-label="Pharmacy Portal Navigation"
      >
        {PHARMACY_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = isLinkActive(item.href);
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
                      ? 'bg-secondary/12 text-secondary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/75',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-pill bg-secondary"
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
                      active ? 'text-secondary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Identity & Sign Out */}
      <div className="p-3 border-t border-border/80 bg-muted/25 space-y-2 shrink-0">
        {!collapsed ? (
          <Link
            href="/pharmacy/profile"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-2.5 p-2 rounded-md bg-surface border border-border/70 hover:border-secondary/30 transition-colors focus-ring"
          >
            <Avatar name={user?.name || 'Pharmacy'} size="sm" status="online" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Pharmacy'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Link>
        ) : (
          <div className="flex justify-center py-1">
            <Avatar name={user?.name || 'Pharmacy'} size="sm" status="online" />
          </div>
        )}

        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoading}
          aria-label="Sign out of pharmacy portal"
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
            aria-label="Pharmacy Navigation Drawer"
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

export default PharmacySidebar;
