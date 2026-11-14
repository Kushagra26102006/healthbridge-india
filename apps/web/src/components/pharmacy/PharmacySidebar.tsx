'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ShieldCheck,
  Truck,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PharmacyNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  section?: string;
}

export const PHARMACY_NAV_SECTIONS = [
  {
    title: 'Clinical Operations',
    items: [
      { label: 'Dashboard', href: '/pharmacy/dashboard', icon: LayoutDashboard },
      { label: 'Prescription Queue', href: '/pharmacy/prescriptions', icon: Pill },
      { label: 'Dispensing Console', href: '/pharmacy/dispensing', icon: CheckCircle2 },
      { label: 'Dispensing History', href: '/pharmacy/dispensing/history', icon: History },
      { label: 'Orders & Fulfillment', href: '/pharmacy/orders', icon: ShoppingCart },
    ],
  },
  {
    title: 'Inventory & Stock Management',
    items: [
      { label: 'Inventory Overview', href: '/pharmacy/inventory', icon: Package },
      { label: 'Medicine Catalogue', href: '/pharmacy/inventory/medicines', icon: BookOpen },
      { label: 'Batch Management', href: '/pharmacy/inventory/batches', icon: Boxes },
      { label: 'Stock-In / Receiving', href: '/pharmacy/inventory/stock-in', icon: ArrowDownToLine },
      { label: 'Stock Adjustment', href: '/pharmacy/inventory/stock-adjustment', icon: SlidersHorizontal },
      { label: 'Transaction Ledger', href: '/pharmacy/inventory/transactions', icon: History },
      { label: 'Expiry Tracking', href: '/pharmacy/inventory/expiry', icon: Clock },
      { label: 'Stock Alerts', href: '/pharmacy/inventory/alerts', icon: AlertTriangle },
    ],
  },
  {
    title: 'Procurement & Purchasing',
    items: [
      { label: 'Suppliers', href: '/pharmacy/suppliers', icon: Truck },
      { label: 'Purchase Orders', href: '/pharmacy/purchases', icon: FileSpreadsheet },
      { label: 'Goods Receipts (GRN)', href: '/pharmacy/purchases/history', icon: ArrowDownToLine },
      { label: 'Stock Replenishment', href: '/pharmacy/replenishment', icon: RefreshCw },
    ],
  },
  {
    title: 'Organization & Account',
    items: [
      { label: 'Notifications', href: '/pharmacy/notifications', icon: Bell },
      { label: 'Pharmacy Profile', href: '/pharmacy/profile', icon: Building2 },
      { label: 'Settings', href: '/pharmacy/settings', icon: Settings },
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
  const { user, logout } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/pharmacy/dashboard') {
      return pathname === '/pharmacy/dashboard' || pathname === '/pharmacy';
    }
    if (href === '/pharmacy/inventory') {
      return pathname === '/pharmacy/inventory';
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 shrink-0">
        <Link href="/pharmacy/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5 text-slate-950" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white leading-none">
                HealthBridge
              </span>
              <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider mt-1">
                Pharmacy Portal
              </span>
            </div>
          )}
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Verified Badge Pill */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate font-medium">{user?.name || 'Verified Pharmacy'}</span>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono"
            >
              PHARMACY
            </Badge>
          </div>
        </div>
      )}

      {/* Nav Menu Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {PHARMACY_NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-semibold tracking-wider uppercase text-slate-400/90 mb-1.5">
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
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs md:text-sm transition-all duration-150 group',
                    active
                      ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border-l-4 border-teal-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Footer Area */}
      <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-full py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <span className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Collapse Sidebar
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors',
            collapsed && 'justify-center'
          )}
          title="Sign out of pharmacy portal"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 transition-all duration-200 sticky top-0 h-screen z-30',
          collapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Slider */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 md:hidden transform transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
export default PharmacySidebar;
